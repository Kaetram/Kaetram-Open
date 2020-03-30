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
var BulkySituation = /** @class */ (function (_super) {
    __extends(BulkySituation, _super);
    function BulkySituation(player, data) {
        var _this = _super.call(this, player, data) || this;
        _this.player = player;
        _this.data = data;
        _this.lastNPC = null;
        return _this;
    }
    BulkySituation.prototype.load = function (stage) {
        _super.prototype.load.call(this, stage);
        if (this.stage > 9998)
            return;
        this.loadCallbacks();
    };
    BulkySituation.prototype.loadCallbacks = function () {
        var _this = this;
        this.onNPCTalk(function (npc) {
            if (_this.hasRequirement()) {
                _this.progress('item');
                return;
            }
            var conversation = _this.getConversation(npc.id);
            _this.lastNPC = npc;
            _this.player.send(new messages_1["default"].NPC(packets_1["default"].NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(conversation, _this.player)
            }));
            if (npc.talkIndex === 0)
                _this.progress('talk');
        });
    };
    BulkySituation.prototype.progress = function (type) {
        var task = this.data.task[this.stage];
        if (!task || task !== type)
            return;
        if (this.stage === this.data.stages) {
            this.finish();
            return;
        }
        switch (type) {
            case 'item':
                this.player.inventory.remove(this.getItem(), 1);
                break;
        }
        this.resetTalkIndex(this.lastNPC);
        this.stage++;
        this.player.send(new messages_1["default"].Quest(packets_1["default"].QuestOpcode.Progress, {
            id: this.id,
            stage: this.stage,
            isQuest: true
        }));
        this.update();
    };
    BulkySituation.prototype.finish = function () {
        _super.prototype.finish.call(this);
    };
    BulkySituation.prototype.hasRequirement = function () {
        return (this.getTask() === 'item' &&
            this.player.inventory.contains(this.getItem()));
    };
    return BulkySituation;
}(quest_1["default"]));
exports["default"] = BulkySituation;
