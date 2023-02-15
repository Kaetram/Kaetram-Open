import QuestIndex from './quest/impl';

import quests from '../../../../../data/quests.json';
import { Quest as QuestPacket } from '../../../../network/packets';

import { Modules, Opcodes } from '@kaetram/common/network';

import type { PointerData } from '@kaetram/common/types/pointer';
import type { PopupData } from '@kaetram/common/types/popup';
import type { QuestData, RawQuest, SerializedQuest } from '@kaetram/common/types/quest';
import type Player from './player';
import type Quest from './quest/quest';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';

/**
 * Initialize all the quests on a player instance basis. The previous
 * system used a controller and it was quite clunky. Load all quests
 * when a player logs in, and update data for each.
 */

export default class Quests {
    // All the quests are contained here.
    private quests: { [key: string]: Quest } = {};

    private loadCallback?: () => void;

    public constructor(private player: Player) {
        // Iterates through the raw quests in the JSON and creates an instance of them
        for (let key in quests) {
            // Checks if the JSON quest exists in our implementation.
            if (!(key in QuestIndex)) continue;

            // Create an instance and pass the quest data along.
            let quest = new QuestIndex[key as keyof typeof QuestIndex](
                key,
                quests[key as keyof typeof quests]
            );

            this.quests[key] = quest;

            quest.onProgress(this.handleProgress.bind(this));
            quest.onPointer(this.handlePointer.bind(this));
            quest.onPopup(this.handlePopup.bind(this));
        }
    }

    /**
     * Loads the quest data from the database into
     * the player's instance.
     * @param questInfo Array containing data for each quest.
     */

    public load(questInfo: QuestData[]): void {
        for (let info of questInfo) {
            let quest = this.get(info.key);

            // Set quest stage data without making a progress callback if it exists.
            if (quest) quest.setStage(info.stage, info.subStage, false);
        }

        // Trigger `loaded()` when we have no database information.
        if (questInfo.length === 0) this.forEachQuest((quest: Quest) => quest.loaded());

        this.loadCallback?.();
    }

    /**
     * The callback function for when a quest advances in stages.
     * @param key The quest's key.
     * @param stage The stage we are progressing to.
     * @param subStage The sub stage we are progressing to.
     */

    private handleProgress(key: string, stage: number, subStage: number): void {
        this.player.send(
            new QuestPacket(Opcodes.Quest.Progress, {
                key,
                stage,
                subStage
            })
        );

        // Update region when quest is completed.
        if (this.get(key).isFinished()) this.player.updateRegion();

        this.player.updateEntities();
        this.player.save();
    }

    /**
     * The callback handler for when a quest requests pointer information
     * to be sent to the client. Generally happens upon loading the Tutorial
     * quest.
     * @param pointer Pointer information from the current stage.
     */

    private handlePointer(pointer: PointerData): void {
        this.player.pointer(pointer.type, pointer);
    }

    /**
     * Callback handler for when the quest requests to display a popup.
     * @param popup Popup information such as title, text, colour.
     */

    private handlePopup(popup: PopupData): void {
        this.player.popup(popup.title, popup.text, popup.colour);
    }

    /**
     * Grabs a quest with the key specified. Will return
     * undefined if the key is invalid.
     * @param key The quest key.
     * @returns Quest pertaining to the `key` parameter.
     */

    public get(key: string): Quest {
        return this.quests[key];
    }

    /**
     * Checks all the quests at their current stage if the requirement
     * is to interact with the given NPC and return the quest.
     * @param npc The NPC we are checking the quest stage against.
     * @param includeComplete Whether to include completed quests in the search.
     * @returns The quest currently requiring interaction with the NPC.
     */

    public getQuestFromNPC(npc: NPC, includeComplete = false): Quest | undefined {
        let quest: Quest | undefined;

        this.forEachQuest((q: Quest) => {
            if (q.isFinished() && !includeComplete) return;
            if (!q.hasNPC(npc.key)) return;

            // Return only the first quest found,
            if (!quest) quest = q;
        });

        return quest;
    }

    /**
     * Searches through the quests and sees if the mob passed as a parameter
     * corresponds to a currently active quest. Returns the quest if that is the
     * case.
     * @param mob The mob we are checking in all the quests.
     * @returns The quest containing the mob we just killed.
     */

    public getQuestFromMob(mob: Mob): Quest | undefined {
        let quest;

        this.forEachQuest((q) => {
            // Skip if the quest isn't started or if the quest is finished.
            if (q.isFinished() || !q.isStarted()) return;

            let stage = q.getStageData();

            // Skip if the stage is not to kill a mob.
            if (stage.task !== 'kill') return;

            let stageMobs = stage.mob;

            // Skip if we don't have a mob for the given stage.
            if (!stageMobs || stageMobs.length === 0) return;

            // Check if the mob matches the mobs and check the array if it's an array for mob key.
            if (stageMobs.includes(mob.key)) quest = q;
        });

        return quest;
    }

    /**
     * Checks if the player has finished the tutorial.
     * @returns True if the tutorial cannot be found otherwise whether or not the quest is finished.
     */

    public isTutorialFinished(): boolean {
        // Uses the default key from the constants.
        let quest = this.quests[Modules.Constants.TUTORIAL_QUEST_KEY];

        // Default to true if the quest is not found.
        if (!quest) return true;

        // If the quest exists we return its status.
        return quest.isFinished();
    }

    /**
     * Used for checking whether the player can attack within the tutorial. Due to people
     * farming the tutorial area, we need to limit the times they are allowed to attack.
     * They can only kill mobs within the tutorial if that is the current task.
     * @returns Whether or not the tutorial task is that of a kill task.
     */

    public canAttackInTutorial(): boolean {
        if (this.isTutorialFinished()) return true;

        return !!this.get(Modules.Constants.TUTORIAL_QUEST_KEY)?.isKillTask();
    }

    /**
     * Similar to `canAttackInTutorial` but for cutting trees. We want to prevent
     * people from sitting in the tutorial area and continuously cutting trees.
     * @returns Whether or not the tutorial task is that of a cut tree task.
     */

    public canCutTreesInTutorial(): boolean {
        if (this.isTutorialFinished()) return true;

        return !!this.get(Modules.Constants.TUTORIAL_QUEST_KEY)?.isCutTreeTask();
    }

    /**
     * Iterates through all the quests and serializes them (saving the
     * key and progress of each one) and returns a SerializedQuest object.
     * @returns SerializedQuest object containing array of quest data.
     */

    public serialize(batch = false): SerializedQuest {
        let quests: QuestData[] = [];

        this.forEachQuest((quest: Quest) => quests.push(quest.serialize(batch)));

        return {
            quests
        };
    }

    /**
     * Iterates through all the quests and makes a callback for each one.
     * @param callback Quest currently being iterated.
     */

    public forEachQuest(callback: (quest: Quest) => void): void {
        for (let key in this.quests) callback(this.quests[key]);
    }

    /**
     * Callback signal for when the quests are loaded.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }
}
