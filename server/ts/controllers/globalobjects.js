"use strict";
exports.__esModule = true;
var objects_1 = require("../util/objects");
/**
 *
 */
var GlobalObjects = /** @class */ (function () {
    function GlobalObjects(world) {
        this.world = world;
    }
    GlobalObjects.prototype.getObject = function (id) {
        return objects_1["default"].getObject(id);
    };
    /**
     * Ripped from `npc.ts` but with some minor adjustments.
     */
    GlobalObjects.prototype.talk = function (object, player) {
        if (player.npcTalk !== object.id) {
            player.npcTalk = object.id;
            player.talkIndex = 0;
        }
        var message = object.messages[player.talkIndex];
        if (player.talkIndex > object.messages.length - 1)
            player.talkIndex = 0;
        else
            player.talkIndex++;
        return message;
    };
    return GlobalObjects;
}());
exports["default"] = GlobalObjects;
