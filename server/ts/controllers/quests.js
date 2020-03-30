"use strict";
exports.__esModule = true;
var _ = require("underscore");
var introduction_1 = require("../game/entity/character/player/quest/impl/introduction");
var bulkysituation_1 = require("../game/entity/character/player/quest/impl/bulkysituation");
var quests_json_1 = require("../../data/quests.json");
var achievements_json_1 = require("../../data/achievements.json");
var achievement_1 = require("../game/entity/character/player/achievement");
/**
 *
 */
var Quests = /** @class */ (function () {
    function Quests(player) {
        this.player = player;
        this.quests = {};
        this.achievements = {};
        this.load();
    }
    Quests.prototype.load = function () {
        var _this = this;
        var questCount = 0;
        _.each(quests_json_1["default"], function (quest) {
            if (questCount === 0)
                _this.quests[quest.id] = new introduction_1["default"](_this.player, quest);
            else if (questCount === 1)
                _this.quests[quest.id] = new bulkysituation_1["default"](_this.player, quest);
            questCount++;
        });
        _.each(achievements_json_1["default"], function (achievement) {
            _this.achievements[achievement.id] = new achievement_1["default"](achievement.id, _this.player);
        });
    };
    Quests.prototype.updateQuests = function (ids, stages) {
        if (!ids || !stages) {
            _.each(this.quests, function (quest) {
                quest.load(0);
            });
            return;
        }
        for (var id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.quests[id])
                this.quests[id].load(stages[id]);
        if (this.questsReadyCallback)
            this.questsReadyCallback();
    };
    Quests.prototype.updateAchievements = function (ids, progress) {
        for (var id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.achievements[id])
                this.achievements[id].setProgress(progress[id]);
        if (this.achievementsReadyCallback)
            this.achievementsReadyCallback();
    };
    Quests.prototype.getQuest = function (id) {
        if (id in this.quests)
            return this.quests[id];
        return null;
    };
    Quests.prototype.getQuests = function () {
        var ids = '';
        var stages = '';
        for (var id = 0; id < this.getQuestSize(); id++) {
            var quest = this.quests[id];
            ids += id + " ";
            stages += quest.stage + " ";
        }
        return {
            username: this.player.username,
            ids: ids,
            stages: stages
        };
    };
    Quests.prototype.getAchievements = function () {
        var ids = '';
        var progress = '';
        for (var id = 0; id < this.getAchievementSize(); id++) {
            ids += id + " ";
            progress += this.achievements[id].progress + " ";
        }
        return {
            username: this.player.username,
            ids: ids,
            progress: progress
        };
    };
    Quests.prototype.getAchievementData = function () {
        var achievements = [];
        this.forEachAchievement(function (achievement) {
            achievements.push(achievement.getInfo());
        });
        return {
            achievements: achievements
        };
    };
    Quests.prototype.getQuestData = function () {
        var quests = [];
        this.forEachQuest(function (quest) {
            quests.push(quest.getInfo());
        });
        return {
            quests: quests
        };
    };
    Quests.prototype.forEachQuest = function (callback) {
        _.each(this.quests, function (quest) {
            callback(quest);
        });
    };
    Quests.prototype.forEachAchievement = function (callback) {
        _.each(this.achievements, function (achievement) {
            callback(achievement);
        });
    };
    Quests.prototype.getQuestsCompleted = function () {
        var count = 0;
        for (var id in this.quests)
            if (this.quests.hasOwnProperty(id))
                if (this.quests[id].isFinished())
                    count++;
        return count;
    };
    Quests.prototype.getAchievementsCompleted = function () {
        var count = 0;
        for (var id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].isFinished())
                    count++;
        return count;
    };
    Quests.prototype.getQuestSize = function () {
        return Object.keys(this.quests).length;
    };
    Quests.prototype.getAchievementSize = function () {
        return Object.keys(this.achievements).length;
    };
    Quests.prototype.getQuestByNPC = function (npc) {
        /**
         * Iterate through the quest list in the order it has been
         * added so that NPC's that are required by multiple quests
         * follow the proper order.
         */
        for (var id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                var quest = this.quests[id];
                if (quest.hasNPC(npc.id))
                    return quest;
            }
        }
        return null;
    };
    Quests.prototype.getAchievementByNPC = function (npc) {
        for (var id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.npc === npc.id &&
                    !this.achievements[id].isFinished())
                    return this.achievements[id];
        return null;
    };
    Quests.prototype.getAchievementByMob = function (mob) {
        for (var id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.mob === mob.id)
                    return this.achievements[id];
        return null;
    };
    Quests.prototype.isQuestMob = function (mob) {
        if (mob.type !== 'mob')
            return false;
        for (var id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                var quest = this.quests[id];
                if (!quest.isFinished() && quest.hasMob(mob.id))
                    return true;
            }
        }
        return false;
    };
    Quests.prototype.isAchievementMob = function (mob) {
        if (mob.type !== 'mob')
            return false;
        for (var id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.mob === mob.id &&
                    !this.achievements[id].isFinished())
                    return true;
        return false;
    };
    Quests.prototype.isQuestNPC = function (npc) {
        if (npc.type !== 'npc')
            return false;
        for (var id in this.quests) {
            if (this.quests.hasOwnProperty(id)) {
                var quest = this.quests[id];
                if (!quest.isFinished() && quest.hasNPC(npc.id))
                    return true;
            }
        }
        return false;
    };
    Quests.prototype.isAchievementNPC = function (npc) {
        if (npc.type !== 'npc')
            return false;
        for (var id in this.achievements)
            if (this.achievements.hasOwnProperty(id))
                if (this.achievements[id].data.npc === npc.id &&
                    !this.achievements[id].isFinished())
                    return true;
        return false;
    };
    Quests.prototype.onAchievementsReady = function (callback) {
        this.achievementsReadyCallback = callback;
    };
    Quests.prototype.onQuestsReady = function (callback) {
        this.questsReadyCallback = callback;
    };
    return Quests;
}());
exports["default"] = Quests;
