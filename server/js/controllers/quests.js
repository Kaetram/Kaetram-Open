/* global module */

let _ = require('underscore'),
    Introduction = require('../game/entity/character/player/quest/impl/introduction'),
    BulkySituation = require('../game/entity/character/player/quest/impl/bulkysituation'),
    QuestData = require('../../data/quests.json'),
    AchievementData = require('../../data/achievements.json'),
    Achievement = require('../game/entity/character/player/achievement');

class Quests {

    constructor(player) {
        let self = this;

        self.player = player;

        self.quests = {};
        self.achievements = {};

        self.load();
    }

    load() {
        let self = this,
            questCount = 0;

        _.each(QuestData, (quest) => {

            if (questCount === 0)
                self.quests[quest.id] = new Introduction(self.player, quest);
            else if (questCount === 1)
                self.quests[quest.id] = new BulkySituation(self.player, quest);

            questCount++;
        });

        _.each(AchievementData, (achievement) => {
            self.achievements[achievement.id] = new Achievement(achievement.id, self.player);
        });
    }

    updateQuests(ids, stages, subStages) {
        let self = this;

        if (!ids || !stages) {
            _.each(self.quests, (quest) => {
                quest.load(0);
            });

            return;
        }

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && self.quests[id])
                self.quests[id].load(stages[id]);
    }

    updateAchievements(ids, progress) {
        let self = this;

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && self.achievements[id])
                self.achievements[id].setProgress(progress[id]);

        if (self.readyCallback)
            self.readyCallback();
    }

    getQuest(id) {
        let self = this;

        if (id in self.quests)
            return self.quests[id];

        return null;
    }

    getQuests() {
        let self = this,
            ids = '',
            stages = '',
            subStages = '';

        for (let id = 0; id < self.getQuestSize(); id++) {
            var quest = self.quests[id];

            ids += id + ' ';
            stages += quest.stage + ' ';

            _.each(quest.subStages, (value, key) => {
                subStages += id + ':' + key + '-' + value + ' '
            });

        }

        return {
            username: self.player.username,
            ids: ids,
            stages: stages,
            subStages: subStages
        }
    }

    getAchievements() {
        let self = this,
            ids = '',
            progress = '';

        for (let id = 0; id < self.getAchievementSize(); id++) {
            ids += id + ' ';
            progress += self.achievements[id].progress + ' '
        }

        return {
            username: self.player.username,
            ids: ids,
            progress: progress
        }
    }

    getData() {
        let self = this,
            quests = [],
            achievements = [];

        self.forEachQuest((quest) => {
            quests.push(quest.getInfo());
        });

        self.forEachAchievement((achievement) => {
            achievements.push(achievement.getInfo());
        });

        return {
            quests: quests,
            achievements: achievements
        };
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
        let self = this,
            count = 0;

        for (let id in self.quests)
            if (self.quests.hasOwnProperty(id))
                if (self.quests[id].isFinished())
                    count++;

        return count;
    }

    getAchievementsCompleted() {
        let self = this,
            count = 0;

        for (let id in self.achievements)
            if (self.achievements.hasOwnProperty(id))
                if (self.achievements[id].isFinished())
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
        let self = this;

        /**
         * Iterate through the quest list in the order it has been
         * added so that NPC's that are required by multiple quests
         * follow the proper order.
         */

        for (let id in self.quests) {
            if (self.quests.hasOwnProperty(id)) {
                let quest = self.quests[id];

                if (quest.hasNPC(npc.id))
                    return quest;
            }
        }

        return null;
    }

    getAchievementByNPC(npc) {
        let self = this;

        for (let id in self.achievements)
            if (self.achievements.hasOwnProperty(id))
                if (self.achievements[id].data.npc === npc.id && !self.achievements[id].isFinished())
                    return self.achievements[id];

        return null;
    }

    getAchievementByMob(mob) {
        let self = this;

        for (let id in self.achievements)
            if (self.achievements.hasOwnProperty(id))
                if (self.achievements[id].data.mob === mob.id)
                    return self.achievements[id];

        return null;
    }

    isQuestMob(mob) {
        let self = this;

        for (let id in self.quests) {
            if (self.quests.hasOwnProperty(id)) {
                let quest = self.quests[id];

                if (!quest.isFinished() && quest.hasMob(mob.id))
                    return true;
            }
        }
    }

    isAchievementMob(mob) {
        let self = this;

        for (let id in self.achievements)
            if (self.achievements.hasOwnProperty(id))
                if (self.achievements[id].data.mob === mob.id && !self.achievements[id].isFinished())
                    return true;

        return false;
    }

    isQuestNPC(npc) {
        let self = this;

        for (let id in self.quests) {
            if (self.quests.hasOwnProperty(id)) {
                let quest = self.quests[id];

                if (!quest.isFinished() && quest.hasNPC(npc.id))
                    return true;
            }
        }
    }

    isAchievementNPC(npc) {
        let self = this;

        for (let id in self.achievements)
            if (self.achievements.hasOwnProperty(id))
                if (self.achievements[id].data.npc === npc.id && !self.achievements[id].isFinished())
                    return true;

        return false;
    }

    onReady(callback) {
        this.readyCallback = callback;
    }

}

module.exports = Quests;
