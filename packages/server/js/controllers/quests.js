/* global module */

let _ = require('underscore'),
    Introduction = require('../game/entity/character/player/quests/impl/introduction'),
    BulkySituation = require('../game/entity/character/player/quests/impl/bulkysituation'),
    QuestData = require('../../data/quests.json'),
    AchievementData = require('../../data/achievements.json'),
    Achievement = require('../game/entity/character/player/achievement');

class Quests {

    constructor(player) {
        this.player = player;

        this.quests = {};
        this.achievements = {};

        this.load();
    }

    load() {
        let questCount = 0;

        _.each(QuestData, (quest) => {

            if (questCount === 0)
                this.quests[quest.id] = new Introduction(this.player, quest);
            else if (questCount === 1)
                this.quests[quest.id] = new BulkySituation(this.player, quest);

            questCount++;
        });

        _.each(AchievementData, (achievement) => {
            this.achievements[achievement.id] = new Achievement(achievement.id, this.player);
        });
    }

    updateQuests(ids, stages) {
        if (!ids || !stages) {
            _.each(this.quests, (quest) => {
                quest.load(0);
            });

            return;
        }

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.quests[id])
                this.quests[id].load(stages[id]);

        if (this.questsReadyCallback)
            this.questsReadyCallback();
    }

    updateAchievements(ids, progress) {
        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.achievements[id])
                this.achievements[id].setProgress(progress[id], true);

        if (this.achievementsReadyCallback)
            this.achievementsReadyCallback();
    }

    getQuest(id) {
        if (id in this.quests)
            return this.quests[id];

        return null;
    }

    getAchievement(id) {
        if (!this.achievements || !this.achievements[id])
            return null;

        return this.achievements[id];
    }

    getQuests() {
        let ids = '',
            stages = '';

        for (let id = 0; id < this.getQuestSize(); id++) {
            let quest = this.quests[id];

            ids += id + ' ';
            stages += quest.stage + ' ';

        }

        return {
            username: this.player.username,
            ids: ids,
            stages: stages
        }
    }

    getAchievements() {
        let ids = '',
            progress = '';

        for (let id = 0; id < this.getAchievementSize(); id++) {
            ids += id + ' ';
            progress += this.achievements[id].progress + ' '
        }

        return {
            username: this.player.username,
            ids: ids,
            progress: progress
        }
    }

    getAchievementData() {
        let achievements = [];

        this.forEachAchievement((achievement) => {
            achievements.push(achievement.getInfo());
        });

        return {
            achievements: achievements
        }
    }

    getQuestData() {
        let quests = [];

        this.forEachQuest((quest) => {
            quests.push(quest.getInfo());
        });

        return {
            quests: quests
        }
    }

    forEachQuest(callback) {
        _.each(this.quests, (quest) => {
            callback(quest);
        });
    }

    forEachAchievement(callback) {
        _.each(this.achievements, (achievement) => {
            callback(achievement);
        });
    }

    getQuestsCompleted() {
        let count = 0;

        for (let id in this.quests)
            if (this.quests.hasOwnProperty(id))
                if (this.quests[id].isFinished())
                    count++;

        return count;
    }

    getAchievementsCompleted() {
        let count = 0;

        for (let id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].isFinished())
                    count++;

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

        for (let id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                let quest = this.quests[id];

                if (quest.hasNPC(npc.id))
                    return quest;
            }
        }

        return null;
    }

    getAchievementByNPC(npc) {

        for (let id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.npc === npc.id && !this.achievements[id].isFinished())
                    return this.achievements[id];

        return null;
    }

    getAchievementByMob(mob) {

        for (let id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.mob === mob.id)
                    return this.achievements[id];

        return null;
    }

    isQuestMob(mob) {

        if (mob.type !== 'mob')
            return false;

        for (let id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasMob(mob.id))
                    return true;
            }
        }

        return false;
    }

    isAchievementMob(mob) {
        if (mob.type !== 'mob')
            return false;

        for (let id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.mob === mob.id && !this.achievements[id].isFinished())
                    return true;

        return false;
    }

    isQuestNPC(npc) {

        if (npc.type !== 'npc')
            return false;

        for (let id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasNPC(npc.id))
                    return true;
            }
        }

        return false;
    }

    isAchievementNPC(npc) {

        if (npc.type !== 'npc')
            return false;

        for (let id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.npc === npc.id && !this.achievements[id].isFinished())
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

module.exports = Quests;
