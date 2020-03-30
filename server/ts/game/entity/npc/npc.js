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
var entity_1 = require("../entity");
/**
 *
 */
var NPC = /** @class */ (function (_super) {
    __extends(NPC, _super);
    function NPC(id, instance, x, y) {
        var _this = _super.call(this, id, 'npc', instance, x, y) || this;
        _this.talkIndex = 0;
        return _this;
    }
    NPC.prototype.talk = function (messages, player) {
        if (!player)
            return;
        if (player.npcTalk !== this.id) {
            player.talkIndex = 0;
            player.npcTalk = this.id;
        }
        var message = messages[player.talkIndex];
        if (player.talkIndex > messages.length - 1)
            player.talkIndex = 0;
        else
            player.talkIndex++;
        return message;
    };
    return NPC;
}(entity_1["default"]));
exports["default"] = NPC;
