import _ from 'lodash';

import NPC from '../../../npc/npc';
import Mob from '../../mob/mob';
import Player from '../player';

import log from '@kaetram/common/util/log';

import { QuestData, RawQuest, RawStage, StageData } from '@kaetram/common/types/quest';
import { PointerData } from '@kaetram/common/types/pointer';
import { ProcessedDoor } from '@kaetram/common/types/map';

export default abstract class Quest {
    /**
     * An abstract quest class that takes the raw quest data and
     * de-serializes its data into a quest object for later use.
     */

    private name = '';
    private description = '';
    private stage = 0; // How far along in the quest we are.
    private subStage = 0; // Progress in the substage (say we're tasked to kill 20 rats).
    private stageCount = 0; // How long the quest is.

    private stages: { [id: number]: RawStage } = {};

    // Store all NPCs involved in the quest.
    private npcs: string[] = [];

    public talkCallback?: (npc: NPC, player: Player) => void;
    public doorCallback?: (quest: ProcessedDoor) => void;
    public killCallback?: (mob: Mob) => void;

    private progressCallback?: (key: string, stage: number, subStage: number) => void;
    private pointerCallback?: (pointerData: PointerData) => void;

    public constructor(private key: string, rawData: RawQuest) {
        this.name = rawData.name;
        this.description = rawData.description;
        this.stageCount = Object.keys(rawData.stages).length;

        this.stages = rawData.stages;

        this.loadNPCs();

        // Callbacks
        this.onTalk(this.handleTalk.bind(this));
        this.onDoor(this.handleDoor.bind(this));
        this.onKill(this.handleKill.bind(this));
    }

    /**
     * Blank function for use in subclasses. See `Tutorial.ts`.
     */

    public loaded(): void {
        log.debug(`[${this.key}] Uninitialized loaded();`);
    }

    /**
     * Parses through all the stages and stores the NPCs that the player
     * will engage with. This is necessary in order to prevent the default
     * dialogue from occurring while the quest is in progress.
     */

    private loadNPCs(): void {
        // Iterate through the stages and extract the NPCs
        _.each(this.stages, (stage: RawStage) => {
            if (stage.npc && !this.hasNPC(stage.npc)) this.npcs.push(stage.npc);
        });
    }

    /**
     * Callback handler for when talking to a quest
     * NPC required for progression.
     * @param npc The NPC we are talking to.
     * @param talkIndex Current progress in the conversation.
     */

    private handleTalk(npc: NPC, player: Player): void {
        log.debug(`[${this.name}] Talking to NPC: ${npc.key} - stage: ${this.stage}.`);

        // Extract the dialogue for the NPC.
        let stageData = this.getStageData(),
            dialogue = this.getNPCDialogue(npc);

        // End of conversation handler.
        if (stageData.npc! === npc.key && dialogue.length === player.talkIndex)
            if (!this.hasItemRequirement()) this.progress();
            else this.handleItemRequirement(player, stageData);

        // Talk to the NPC and progress the dialogue.
        npc.talk(player, dialogue);
    }

    /**
     * Callback handler for when the player attempts to pass through the door.
     * @param x The door's x grid coordinate.
     * @param y The door's y grid coordinate.
     * @param destX The door's destination x coordinate.
     * @param destY The door's destination y coordinate.
     */

    private handleDoor(quest: ProcessedDoor): void {
        console.log(quest);
    }

    /**
     * Handler when killing a mob. Determines
     * whether to progress or not.
     * @param mob The mob we are killing.
     */

    private handleKill(mob: Mob): void {
        log.debug(`[${this.name}] Killing mob: ${mob.key}.`);

        let stageData = this.getStageData();

        if (stageData.task !== 'kill') return;
    }

    /**
     * Advances the quest to the next stage.
     */

    public progress(subStage?: boolean): void {
        log.warning('Received progress yo');

        // Progress substage only if the parameter is defined.
        if (subStage) this.setStage(this.stage, ++this.subStage);
        else this.setStage(++this.stage);
    }

    /**
     * Checks the player's inventory and progresses if
     * he contains enough of the required item.
     * @param player The player we are checking inventory of.
     */

    public handleItemRequirement(player: Player, stageData: StageData): void {
        // Extract the item key and count requirement.
        let { itemRequirement, countRequirement } = stageData,
            index = player.inventory.getIndex(itemRequirement, countRequirement);

        // Cannot find the item in the inventory (or with correct count).
        if (index === -1) return;

        // Remove `countRequirement` amount of an item at the index.
        player.inventory.remove(index, countRequirement);

        this.progress();
    }

    /**
     * Checks if an NPC key is contained in the quest.
     * @param key The NPC key we are checking.
     * @returns If the key exists in the npcs array.
     */

    public hasNPC(key: string): boolean {
        return this.npcs.includes(key);
    }

    /**
     * Checks if the current stage has an item requirement.
     * @returns If the item requirement property exists in the current stage.
     */

    public hasItemRequirement(): boolean {
        return !!this.getStageData().itemRequirement;
    }

    /**
     * A check if the quest is started or it has yet to be discovered.
     * @returns Whether the stage progress is above 0.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }

    /**
     * Checks if a quest is finished given the current progress and stage count.
     * @returns If the progress is greater or equal to stage count.
     */

    public isFinished(): boolean {
        return this.stage > this.stageCount;
    }

    /**
     * Returns a StageData object about the current stage. It contains information about
     * what NPC the player must interact with to progress, or how many mobs to kill to
     * progress.
     * @returns StageData object containing potential npc, mob, and stage count.
     */

    public getStageData(): StageData {
        let stage = this.stages[this.stage];

        return {
            task: stage.task,
            npc: stage.npc! || '',
            mob: stage.mob! || '',
            countRequirement: stage.countRequirement! || 1,
            text: stage.text! || [''],
            pointer: stage.pointer! || undefined
        };
    }

    /**
     * Iterates backwards through our stages starting at the stage we're
     * currently on. If we find a reference to the NPC passed as a parameter,
     * we extract the dialogue for that stage. If the stage we are currently
     * on is higher than the stage we find the NPC in, then we use `completedText`
     * specified in the StageData object.
     * Extra Info: `completedText` refers to text when a user interacts with an NPC
     * that is no longer required for progression to the next stage.
     * @param npc The npc we are trying to find within our stages.
     * @returns An array of strings containing the dialogue.
     */

    public getNPCDialogue(npc: NPC): string[] {
        // Iterate backwards, last reference of the NPC is the text we grab.
        for (let i = this.stage; i > -1; i--) {
            // We do not count iterations of stages above stage we are currently on.
            if (this.stage < i) continue;

            let stage = this.stages[i];

            // Skip the stage if no npc info is found.
            if (!stage.npc!) continue;

            // If no key is found, continue iterating.
            if (stage.npc! !== npc.key) continue;

            /**
             * If the stage we are currently on is not the same as the most
             * recent stage containing the NPC, then we use the dialogue
             * for after the stage is completed.
             */
            if (this.stage > i) return stage.completedText!;

            return stage.text!;
        }

        return [''];
    }

    /**
     * Sets the stage (and subStage if specified) and makes a callback.
     * @param stage The new stage we are setting the quest to.
     * @param subStage Optionally set the stage to a subStage index.
     * @param progressCallback Conditional on whether we want to make a callback or not.
     */

    public setStage(stage: number, subStage = 0, progressCallback = true): void {
        // Progression to a new stage.
        if (this.stage !== stage && progressCallback)
            this.progressCallback?.(this.key, stage, subStage);

        this.stage = stage;
        this.subStage = subStage;

        // Grab the latest stage after updating.
        let stageData = this.getStageData();

        // Check if the current stage has any pointer information.
        if (stageData.pointer) this.pointerCallback?.(stageData.pointer);
    }

    /**
     * Serializes the quest's data to be stored
     * in the database. Save information such as
     * the quest key and progress.
     */

    public serialize(batch = false): QuestData {
        let data: QuestData = {
            key: this.key,
            stage: this.stage,
            subStage: this.subStage
        };

        if (batch) {
            data.name = this.name;
            data.description = this.description;
            data.started = this.isStarted();
            data.finished = this.isFinished();
        }

        return data;
    }

    /**
     * A callback whenever we progress the quest.
     * @param callback The quest's key and progress count;
     */

    public onProgress(callback: (key: string, stage: number, subStage: number) => void): void {
        this.progressCallback = callback;
    }

    /**
     * A callback for whenever a pointer is requested.
     * @param callback Pointer data to be displayed.
     */

    public onPointer(callback: (pointerData: PointerData) => void): void {
        this.pointerCallback = callback;
    }

    /**
     * Callback when a talking action with an NPC occurs.
     * @param callback The NPC the interaction happens with.
     */

    public onTalk(callback: (npc: NPC, player: Player) => void): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when attempting to go through a door.
     * @param callback Callback containing starting location and destination of the door.
     */

    public onDoor(callback: (quest: ProcessedDoor) => void): void {
        this.doorCallback = callback;
    }

    /**
     * Callback for when a mob is killed.
     * @param callback The mob that is being killed.
     */

    public onKill(callback: (mob: Mob) => void): void {
        this.killCallback = callback;
    }
}
