"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var quest_1 = require("../quest");
var packets_1 = require("../../../../../../network/packets");
var messages_1 = require("../../../../../../network/messages");
/**
 *
 */
var Introduction = /** @class */ (function (_super) {
    __extends(Introduction, _super);
    function Introduction(player, data) {
        var _this = _super.call(this, player, data) || this;
        _this.player = player;
        _this.data = data;
        _this.lastNPC = null;
        return _this;
    }
    Introduction.prototype.load = function (stage) {
        if (!this.player.inTutorial()) {
            this.setStage(9999);
            this.update();
            return;
        }
        _super.prototype.load.call(this, stage);
        this.updatePointers();
        this.toggleChat();
        if (this.stage > 9998)
            return;
        this.loadCallbacks();
    };
    Introduction.prototype.loadCallbacks = function () {
        var _this = this;
        this.onNPCTalk(function (npc) {
            var conversation = _this.getConversation(npc.id);
            _this.lastNPC = npc;
            _this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(conversation, _this.player)
            }));
            if (npc.talkIndex === 0)
                _this.progress('talk');
        });
        this.player.onReady(function () {
            _this.updatePointers();
        });
        this.player.onDoor(function (destX, destY) {
            if (_this.getTask() !== 'door') {
                _this.player.notify('You cannot go through this door yet.');
                return;
            }
            if (!_this.verifyDoor(_this.player.x, _this.player.y))
                _this.player.notify('You are not supposed to go through here.');
            else {
                _this.progress('door');
                _this.player.teleport(destX, destY, false);
            }
        });
        this.player.onInventory(function (isOpen) {
            if (isOpen && _this.stage === 1)
                _this.progress('click');
        });
        this.player.onProfile(function (isOpen) {
            if (isOpen && _this.stage === 3)
                _this.progress('click');
        });
        this.player.onWarp(function (isOpen) {
            if (isOpen && _this.stage === 5)
                _this.progress('click');
        });
        this.player.onKill(function (character) {
            if (_this.data.kill[_this.stage] === character.id)
                _this.progress('kill');
        });
    };
    Introduction.prototype.progress = function (type) {
        var task = this.data.task[this.stage];
        if (!task || task !== type)
            return;
        if (this.stage === this.data.stages) {
            this.finish();
            return;
        }
        switch (type) {
            case 'door':
                if (this.stage === 7)
                    this.player.inventory.add({
                        id: 248,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });
                else if (this.stage === 15)
                    this.player.inventory.add({
                        id: 87,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });
                break;
        }
        this.stage++;
        this.clearPointers();
        this.resetTalkIndex(this.lastNPC);
        this.update();
        this.updatePointers();
        this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Progress, {
            id: this.id,
            stage: this.stage,
            isQuest: true
        }));
        if (this.getTask() === 'door')
            this.player.updateRegion();
    };
    Introduction.prototype.isFinished = function () {
        return _super.prototype.isFinished.call(this) || !this.player.inTutorial();
    };
    Introduction.prototype.toggleChat = function () {
        this.player.canTalk = !this.player.canTalk;
    };
    Introduction.prototype.setStage = function (stage) {
        _super.prototype.setStage.call(this, stage);
        this.clearPointers();
    };
    Introduction.prototype.finish = function () {
        this.toggleChat();
        _super.prototype.finish.call(this);
    };
    Introduction.prototype.hasDoorUnlocked = function (door) {
        switch (door.id) {
            case 0:
                return this.stage > 6;
            case 6:
                return this.stage > 14;
            case 7:
                return this.stage > 22;
        }
        return false;
    };
    Introduction.prototype.verifyDoor = function (destX, destY) {
        var doorData = this.data.doors[this.stage];
        if (!doorData)
            return;
        return doorData[0] === destX && doorData[1] === destY;
    };
    Introduction.prototype.onFinishedLoading = function (callback) {
        this.finishedCallback = callback;
    };
    return Introduction;
}(quest_1["default"]));
exports["default"] = Introduction;
