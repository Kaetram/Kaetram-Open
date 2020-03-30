"use strict";
exports.__esModule = true;
var messages_1 = require("../../../../../network/messages");
var packets_1 = require("../../../../../network/packets");
var utils_1 = require("../../../../../util/utils");
/**
 *
 */
var Quest = /** @class */ (function () {
    function Quest(player, data) {
        this.player = player;
        this.data = data;
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.stage = 0;
    }
    Quest.prototype.load = function (stage) {
        if (!stage)
            this.update();
        else
            this.stage = parseInt(stage);
    };
    Quest.prototype.finish = function () {
        if (this.hasItemReward()) {
            var item = this.getItemReward();
            if (item) {
                if (this.hasInventorySpace(item.id, item.count))
                    this.player.inventory.add(item.id, item.count);
                else {
                    this.player.notify('You do not have enough space in your inventory.');
                    this.player.notify('Please make room prior to finishing the quest.');
                    return;
                }
            }
        }
        this.setStage(9999);
        this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Finish, {
            id: this.id,
            isQuest: true
        }));
        this.update();
    };
    Quest.prototype.setStage = function (stage) {
        this.stage = stage;
        this.update();
    };
    Quest.prototype.triggerTalk = function (npc) {
        if (this.npcTalkCallback)
            this.npcTalkCallback(npc);
    };
    Quest.prototype.update = function () {
        return this.player.save();
    };
    Quest.prototype.getConversation = function (id) {
        var conversation = this.data.conversations[id];
        if (!conversation || !conversation[this.stage])
            return [''];
        return conversation[this.stage];
    };
    Quest.prototype.updatePointers = function () {
        if (!this.data.pointers)
            return;
        var pointer = this.data.pointers[this.stage];
        if (!pointer)
            return;
        var opcode = pointer[0];
        if (opcode === 4)
            this.player.send(new messages_1["default"].Pointer(opcode, {
                id: utils_1["default"].generateRandomId(),
                button: pointer[1]
            }));
        else
            this.player.send(new messages_1["default"].Pointer(opcode, {
                id: utils_1["default"].generateRandomId(),
                x: pointer[1],
                y: pointer[2]
            }));
    };
    Quest.prototype.forceTalk = function (npc, message) {
        if (!npc)
            return;
        npc.talkIndex = 0;
        this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
            id: npc.instance,
            text: message
        }));
    };
    Quest.prototype.resetTalkIndex = function (npc) {
        /**
         * Ensures that an NPC does not go off the conversation
         * index and is resetted in order to start a new chat
         */
        if (!npc)
            return;
        npc.talkIndex = 0;
    };
    Quest.prototype.clearPointers = function () {
        this.player.send(new messages_1["default"].Pointer(packets_1["default"].PointerOpcode.Remove, {}));
    };
    Quest.prototype.onNPCTalk = function (callback) {
        this.npcTalkCallback = callback;
    };
    Quest.prototype.hasMob = function (mob) {
        if (!this.data.mobs)
            return;
        return this.data.mobs.indexOf(mob.id) > -1;
    };
    Quest.prototype.hasNPC = function (id) {
        return this.data.npcs.indexOf(id) > -1;
    };
    Quest.prototype.hasItemReward = function () {
        return !!this.data.itemReward;
    };
    Quest.prototype.hasInventorySpace = function (id, count) {
        return this.player.inventory.canHold(id, count);
    };
    Quest.prototype.hasDoorUnlocked = function (door) {
        return this.stage > 9998;
    };
    Quest.prototype.isFinished = function () {
        return this.stage > 9998;
    };
    Quest.prototype.getId = function () {
        return this.id;
    };
    Quest.prototype.getName = function () {
        return this.name;
    };
    Quest.prototype.getTask = function () {
        return this.data.task[this.stage];
    };
    Quest.prototype.getItem = function () {
        return this.data.itemReq ? this.data.itemReq[this.stage] : null;
    };
    Quest.prototype.getStage = function () {
        return this.stage;
    };
    Quest.prototype.getItemReward = function () {
        return this.hasItemReward() ? this.data.itemReward : null;
    };
    Quest.prototype.getDescription = function () {
        return this.description;
    };
    Quest.prototype.getInfo = function () {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            stage: this.getStage(),
            finished: this.isFinished()
        };
    };
    return Quest;
}());
exports["default"] = Quest;
