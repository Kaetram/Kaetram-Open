"use strict";
exports.__esModule = true;
var achievements_json_1 = require("../../../../../data/achievements.json");
var messages_1 = require("../../../../network/messages");
var packets_1 = require("../../../../network/packets");
var modules_1 = require("../../../../util/modules");
/**
 *
 */
var Achievement = /** @class */ (function () {
    function Achievement(id, player) {
        this.id = id;
        this.player = player;
        this.progress = 0;
        this.data = achievements_json_1["default"][this.id];
        this.name = this.data.name;
        this.description = this.data.description;
        this.discovered = false;
    }
    Achievement.prototype.step = function () {
        if (this.isThreshold())
            return;
        this.progress++;
        this.update();
        this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Progress, {
            id: this.id,
            name: this.name,
            progress: this.progress,
            count: this.data.count,
            isQuest: false
        }));
    };
    Achievement.prototype.converse = function (npc) {
        if (this.isThreshold() || this.hasItem())
            this.finish(npc);
        else {
            this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(this.data.text, this.player)
            }));
            if (!this.isStarted() && npc.talkIndex === 0)
                this.step();
        }
    };
    Achievement.prototype.finish = function (npc) {
        var rewardType = this.data.rewardType;
        switch (rewardType) {
            case modules_1["default"].Achievements.Rewards.Item:
                if (!this.player.inventory.hasSpace()) {
                    this.player.notify('You do not have enough space in your inventory to finish this achievement.');
                    return;
                }
                this.player.inventory.add({
                    id: this.data.item,
                    count: this.data.itemCount
                });
                break;
            case modules_1["default"].Achievements.Rewards.Experience:
                this.player.addExperience(this.data.reward);
                break;
        }
        this.setProgress(9999);
        this.update();
        this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Finish, {
            id: this.id,
            name: this.name,
            isQuest: false
        }));
        if (npc && this.player.npcTalkCallback)
            this.player.npcTalkCallback(npc);
    };
    Achievement.prototype.update = function () {
        this.player.save();
    };
    Achievement.prototype.isThreshold = function () {
        return this.progress >= this.data.count;
    };
    Achievement.prototype.hasItem = function () {
        if (this.data.type === modules_1["default"].Achievements.Type.Scavenge &&
            this.player.inventory.contains(this.data.item)) {
            this.player.inventory.remove(this.data.item, this.data.itemCount);
            return true;
        }
        return false;
    };
    Achievement.prototype.setProgress = function (progress) {
        this.progress = parseInt(progress);
        if (this.data.rewardType === 'door')
            this.player.updateRegion();
    };
    Achievement.prototype.isStarted = function () {
        return this.progress > 0;
    };
    Achievement.prototype.isFinished = function () {
        return this.progress > 9998;
    };
    Achievement.prototype.getInfo = function () {
        return {
            id: this.id,
            name: this.name,
            type: this.data.type,
            description: this.description,
            count: this.data.count || 1,
            progress: this.progress,
            finished: this.isFinished()
        };
    };
    return Achievement;
}());
exports["default"] = Achievement;
