import _ from 'lodash';

import achievementData from '../../data/achievements.json';
import questData from '../../data/quests.json';
import Achievement from '../game/entity/character/player/achievement';
import BulkySituation from '../game/entity/character/player/quests/impl/bulkysituation';
import Introduction from '../game/entity/character/player/quests/impl/introduction';

import type { AchievementData, QuestInfo } from '@kaetram/common/types/info';
import type { QuestAchievementBatchData, QuestBatchData } from '@kaetram/common/types/messages';
import type Mob from '../game/entity/character/mob/mob';
import type Player from '../game/entity/character/player/player';
import type Quest from '../game/entity/character/player/quests/quest';
import type { QuestData } from '../game/entity/character/player/quests/quest';
import type NPC from '../game/entity/npc/npc';

export interface PlayerQuests {
    username: string;
    ids: string;
    stages: string;
}

export interface PlayerAchievements {
    username: string;
    ids: string;
    progress: string;
}

export default class Quests {
    public quests: { [id: number]: Quest } = {};
    public achievements: { [id: number]: Achievement } = {};

    private questsReadyCallback?(): void;
    private achievementsReadyCallback?(): void;

    public constructor(private player: Player) {
        this.load();
    }

    private load(): void {
        let questCount = 0;

        _.each(questData, (quest) => {
            let data = quest as QuestData;

            if (questCount === 0) this.quests[quest.id] = new Introduction(this.player, data);
            else if (questCount === 1)
                this.quests[quest.id] = new BulkySituation(this.player, data);

            questCount++;
        });

        _.each(achievementData, (achievement) => {
            this.achievements[achievement.id] = new Achievement(achievement.id, this.player);
        });
    }

    public updateQuests(ids: string[] | null, stages: string[] | null): void {
        if (!ids || !stages) {
            _.each(this.quests, (quest: Quest) => {
                quest.load(0);
            });

            return;
        }

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.quests[id])
                this.quests[id].load(parseInt(stages[id]));

        this.questsReadyCallback?.();
    }

    public updateAchievements(ids: string[], progress: string[]): void {
        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.achievements[id])
                this.achievements[id].setProgress(parseInt(progress[id]), true);

        this.achievementsReadyCallback?.();
    }

    public getQuest<Q extends Quest>(id: number): Q | null {
        if (id in this.quests) return this.quests[id] as Q;

        return null;
    }

    public getAchievement(id: number): Achievement | null {
        if (!this.achievements || !this.achievements[id]) return null;

        return this.achievements[id];
    }

    public getQuests(): PlayerQuests {
        let ids = '',
            stages = '';

        for (let id = 0; id < this.getQuestSize(); id++) {
            let quest = this.quests[id];

            ids += `${id} `;
            stages += `${quest.stage} `;
        }

        return {
            username: this.player.username,
            ids,
            stages
        };
    }

    public getAchievements(): PlayerAchievements {
        let ids = '',
            progress = '';

        for (let id = 0; id < this.getAchievementSize(); id++) {
            ids += `${id} `;
            progress += `${this.achievements[id].progress} `;
        }

        return {
            username: this.player.username,
            ids,
            progress
        };
    }

    public getAchievementData(): QuestAchievementBatchData {
        let achievements: AchievementData[] = [];

        this.forEachAchievement((achievement: Achievement) => {
            achievements.push(achievement.getInfo());
        });

        return {
            achievements
        };
    }

    public getQuestData(): QuestBatchData {
        let quests: QuestInfo[] = [];

        this.forEachQuest((quest: Quest) => {
            quests.push(quest.getInfo());
        });

        return {
            quests
        };
    }

    private forEachQuest(callback: (quest: Quest) => void): void {
        _.each(this.quests, (quest) => {
            callback(quest);
        });
    }

    public forEachAchievement(callback: (achievement: Achievement) => void): void {
        _.each(this.achievements, (achievement) => {
            callback(achievement);
        });
    }

    public getQuestsCompleted(): number {
        let count = 0;

        for (let id in this.quests)
            if (
                Object.prototype.hasOwnProperty.call(this.quests, id) &&
                this.quests[id].isFinished()
            )
                count++;

        return count;
    }

    public getAchievementsCompleted(): number {
        let count = 0;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].isFinished()
            )
                count++;

        return count;
    }

    public getQuestSize(): number {
        return Object.keys(this.quests).length;
    }

    public getAchievementSize(): number {
        return Object.keys(this.achievements).length;
    }

    public getQuestByNPC(npc: NPC): Quest | null {
        /**
         * Iterate through the quest list in the order it has been
         * added so that NPC's that are required by multiple quests
         * follow the proper order.
         */

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (quest.hasNPC(npc.id)) return quest;
            }

        return null;
    }

    public getAchievementByNPC(npc: NPC): Achievement | null {
        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.npc === npc.id &&
                !this.achievements[id].isFinished()
            )
                return this.achievements[id];

        return null;
    }

    public getAchievementByMob(mob: Mob): Achievement | null {
        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.mob === mob.id
            )
                return this.achievements[id];

        return null;
    }

    public isQuestMob(mob: Mob): boolean {
        if (mob.type !== 'mob') return false;

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasMob(mob)) return true;
            }

        return false;
    }

    public isAchievementMob(mob: Mob): boolean {
        if (mob.type !== 'mob') return false;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.mob === mob.id &&
                !this.achievements[id].isFinished()
            )
                return true;

        return false;
    }

    public isQuestNPC(npc: NPC): boolean {
        if (npc.type !== 'npc') return false;

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasNPC(npc.id)) return true;
            }

        return false;
    }

    public isAchievementNPC(npc: NPC): boolean {
        if (npc.type !== 'npc') return false;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.npc === npc.id &&
                !this.achievements[id].isFinished()
            )
                return true;

        return false;
    }

    public onAchievementsReady(callback: () => void): void {
        this.achievementsReadyCallback = callback;
    }

    public onQuestsReady(callback: () => void): void {
        this.questsReadyCallback = callback;
    }
}
