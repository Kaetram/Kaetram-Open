import _ from 'underscore';
import Introduction from '../game/entity/character/player/quest/impl/introduction';
import BulkySituation from '../game/entity/character/player/quest/impl/bulkysituation';
import QuestData from '../../data/quests.json';
import AchievementData from '../../data/achievements.json';
import Achievement from '../game/entity/character/player/achievement';
import Quest from '../game/entity/character/player/quest/quest';

class Quests {
    public quests: any;
    public achievements: any;
    public achievementsReadyCallback: any;
    public questsReadyCallback: any;
    public player: any;

    constructor(player) {
        this.player = player;

        this.quests = {};
        this.achievements = {};

        this.load();
    }

    load() {
        let questCount = 0;

        _.each(QuestData, quest => {
            if (questCount === 0)
                this.quests[quest.id] = new Introduction(this.player, quest);
            else if (questCount === 1)
                this.quests[quest.id] = new BulkySituation(this.player, quest);

            questCount++;
        });

        _.each(AchievementData, achievement => {
            this.achievements[achievement.id] = new Achievement(
                achievement.id,
                this.player
            );
        });
    }

    updateQuests(ids, stages) {
        if (!ids || !stages) {
            _.each(this.quests, (quest: Quest) => {
                quest.load(0);
            });

            return;
        }

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.quests[id])
                this.quests[id].load(stages[id]);

        if (this.questsReadyCallback) this.questsReadyCallback();
    }

    updateAchievements(ids, progress) {
        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.achievements[id])
                this.achievements[id].setProgress(progress[id]);

        if (this.achievementsReadyCallback) this.achievementsReadyCallback();
    }

    getQuest(id) {
        if (id in this.quests) return this.quests[id];

        return null;
    }

    getQuests() {
        let ids = '';
        let stages = '';

        for (let id = 0; id < this.getQuestSize(); id++) {
            const quest = this.quests[id];

            ids += id + ' ';
            stages += quest.stage + ' ';
        }

        return {
            username: this.player.username,
            ids,
            stages
        };
    }

    getAchievements() {
        let ids = '';
        let progress = '';

        for (let id = 0; id < this.getAchievementSize(); id++) {
            ids += id + ' ';
            progress += this.achievements[id].progress + ' ';
        }

        return {
            username: this.player.username,
            ids,
            progress
        };
    }

    getAchievementData() {
        const achievements = [];

        this.forEachAchievement(achievement => {
            achievements.push(achievement.getInfo());
        });

        return {
            achievements
        };
    }

    getQuestData() {
        const quests = [];

        this.forEachQuest(quest => {
            quests.push(quest.getInfo());
        });

        return {
            quests
        };
    }

    forEachQuest(callback) {
        _.each(this.quests, quest => {
            callback(quest);
        });
    }

    forEachAchievement(callback) {
        _.each(this.achievements, achievement => {
            callback(achievement);
        });
    }

    getQuestsCompleted() {
        let count = 0;

        for (const id in this.quests)
            if (this.quests.hasOwnProperty(id))
                if (this.quests[id].isFinished()) count++;

        return count;
    }

    getAchievementsCompleted() {
        let count = 0;

        for (const id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].isFinished()) count++;

        return count;
    }

    getQuestSize() {
        return Object.keys(this.quests).length;
    }

    getAchievementSize() {
        return Object.keys(this.achievements).length;
    }

    getQuestByNPC(npc) {
        /**
         * Iterate through the quest list in the order it has been
         * added so that NPC's that are required by multiple quests
         * follow the proper order.
         */

        for (const id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                const quest = this.quests[id];

                if (quest.hasNPC(npc.id)) return quest;
            }
        }

        return null;
    }

    getAchievementByNPC(npc) {
        for (const id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (
                    this.achievements[id].data.npc === npc.id &&
                    !this.achievements[id].isFinished()
                )
                    return this.achievements[id];

        return null;
    }

    getAchievementByMob(mob) {
        for (const id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.mob === mob.id)
                    return this.achievements[id];

        return null;
    }

    isQuestMob(mob) {
        if (mob.type !== 'mob') return false;

        for (const id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                const quest = this.quests[id];

                if (!quest.isFinished() && quest.hasMob(mob.id)) return true;
            }
        }

        return false;
    }

    isAchievementMob(mob) {
        if (mob.type !== 'mob') return false;

        for (const id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (
                    this.achievements[id].data.mob === mob.id &&
                    !this.achievements[id].isFinished()
                )
                    return true;

        return false;
    }

    isQuestNPC(npc) {
        if (npc.type !== 'npc') return false;

        for (const id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                const quest = this.quests[id];

                if (!quest.isFinished() && quest.hasNPC(npc.id)) return true;
            }
        }

        return false;
    }

    isAchievementNPC(npc) {
        if (npc.type !== 'npc') return false;

        for (const id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (
                    this.achievements[id].data.npc === npc.id &&
                    !this.achievements[id].isFinished()
                )
                    return true;

        return false;
    }

    onAchievementsReady(callback) {
        this.achievementsReadyCallback = callback;
    }

    onQuestsReady(callback) {
        this.questsReadyCallback = callback;
    }
}

export default Quests;
