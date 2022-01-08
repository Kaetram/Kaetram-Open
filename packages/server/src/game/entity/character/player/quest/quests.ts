import _ from 'lodash';

import Player from '../player';
import Quest from './impl/quest';

import QuestIndex from './impl';

import { Quest as QuestPacket } from '../../../../../network/packets';

import { Opcodes } from '@kaetram/common/network';
import { QuestData, RawQuest, SerializedQuest } from '@kaetram/common/types/quest';

// Raw quest data
import quests from '../../../../../../data/quests.json';

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
}
