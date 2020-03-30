"use strict";
exports.__esModule = true;
var modules_1 = require("../../../../util/modules");
var utils_1 = require("../../../../util/utils");
/**
 *
 */
var Warp = /** @class */ (function () {
    function Warp(player) {
        this.player = player;
        this.lastWarp = 0;
        this.warpTimeout = 30000;
    }
    Warp.prototype.warp = function (id) {
        if (!this.isCooldown()) {
            this.player.notify("You must wait another " + this.getDuration() + " to warp.");
            return;
        }
        var data = modules_1["default"].Warps[id];
        if (!data)
            return;
        var name = data[0];
        var x = data[3] ? data[1] + utils_1["default"].randomInt(0, 1) : data[1];
        var y = data[3] ? data[2] + utils_1["default"].randomInt(0, 1) : data[2];
        var levelRequirement = data[4];
        console.info("Player Rights: " + this.player.rights);
        if (!this.player.finishedTutorial()) {
            this.player.notify('You cannot warp while in this event.');
            return;
        }
        if (this.hasRequirement()) {
            this.player.notify("You must be at least level " + levelRequirement + " to warp here!");
            return;
        }
        this.player.teleport(x, y, false, true);
        this.player.notify("You have been warped to " + name);
        this.lastWarp = new Date().getTime();
    };
    Warp.prototype.setLastWarp = function (lastWarp) {
        if (isNaN(lastWarp)) {
            this.lastWarp = 0;
            this.player.save();
        }
        else
            this.lastWarp = lastWarp;
    };
    Warp.prototype.isCooldown = function () {
        return (this.getDifference() > this.warpTimeout || this.player.rights > 1);
    };
    Warp.prototype.hasRequirement = function (levelRequirement) {
        return (this.player.level < levelRequirement || !(this.player.rights > 1));
    };
    Warp.prototype.getDuration = function () {
        var difference = this.warpTimeout - this.getDifference();
        if (!difference)
            return '5 minutes';
        return difference > 60000
            ? Math.ceil(difference / 60000) + " minutes"
            : Math.floor(difference / 1000) + " seconds";
    };
    Warp.prototype.getDifference = function () {
        return new Date().getTime() - this.lastWarp;
    };
    return Warp;
}());
exports["default"] = Warp;
