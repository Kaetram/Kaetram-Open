import _ from 'lodash';

import Player from '../player';
import Quest from './impl/quest';

import QuestIndex from './impl';

import { Quest as QuestPacket } from '../../../../../network/packets';

import { Opcodes } from '@kaetram/common/network';
import { QuestData, RawQuest, SerializedQuest } from '@kaetram/common/types/quest';

// Raw quest data
import quests from '../../../../../../data/quests.json';
import NPC from '../../../npc/npc';
import Mob from '../../mob/mob';

/**
 * Initialize all the quests on a player instance basis. The previous
 * system used a controller and it was quite clunky. Load all quests
 * when a player logs in, and update data for each.
 */

export default class Quests {
    // All the quests are contained here.
    private quests: { [key: string]: Quest } = {};

    public constructor(private player: Player) {
        // Iterates through the raw quests in the JSON and creates an instance of them
        _.each(quests, (rawQuest: RawQuest, key: string) => {
            // Checks if the JSON quest exists in our implementation.
            if (!(key in QuestIndex)) return;

            // Create an instance and pass the quest data along.
            let quest = new QuestIndex[key as keyof typeof QuestIndex](key, rawQuest);

            this.quests[key] = quest;

            quest.onProgress(this.handleQuestProgress.bind(this));
        });
    }

    public load(questInfo: QuestData[]): void {
        _.each(questInfo, (info: QuestData) => {
            let quest = this.quests[info.key];

            if (!quest) return;

            quest.update(info.stage, info.subStage);
        });
    }

    /**
     * The callback function for when a quest advances in stages.
     * @param key The quest's key.
     * @param stage The stage we are progressing to.
     */

    private handleQuestProgress(key: string, stage: number): void {
        this.player.send(
            new QuestPacket(Opcodes.Quest.Progress, {
                key,
                stage
            })
        );
    }

    /**
     * Checks all the quests at their current stage if the requirement
     * is to interact with the given NPC and return the quest.
     * @param npc The NPC we are checking the quest stage against.
     * @returns The quest currently requiring interaction with the NPC.
     */

    public getQuestFromNPC(npc: NPC): Quest | undefined {
        let quest;

        this.forEachQuest((q: Quest) => {
            if (q.isFinished()) return;

            let stage = q.getStageData();

            // Skip if the stage isn't to talk to an NPC.
            if (stage.task !== 'talk') return;

            if (stage.npc === npc.key) quest = q;
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

        this.forEachQuest((q: Quest) => {
            // Skip if the quest isn't started or if the quest is finished.
            if (q.isFinished() || !q.isStarted()) return;

            let stage = q.getStageData();

            // Skip if the stage is not to kill a mob.
            if (stage.task !== 'kill') return;

            let stageMob = stage.mob;

            // Skip if we don't have a mob for the given stage.
            if (!stageMob) return;

            // Check if the mob matches the mobs and check the array if it's an array for mob key.
            if (stageMob === mob.key || (_.isArray(stageMob) && stageMob.includes(mob.key)))
                quest = q;
        });

        return quest;
    }

    /**
     * Iterates through all the quests and serializes them (saving the
     * key and progress of each one) and returns a SerializedQuest object.
     * @returns SerializedQuest object containing array of quest data.
     */

    public serialize(): SerializedQuest {
        let quests: QuestData[] = [];

        _.each(this.quests, (quest: Quest) => quests.push(quest.serialize()));

        return {
            quests
        };
    }

    /**
     * Iterates through all the quests and makes a callback for each one.
     * @param callback Quest currently being iterated.
     */

    private forEachQuest(callback: (quest: Quest) => void): void {
        _.each(this.quests, callback);
    }
}
