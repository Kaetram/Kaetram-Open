"use strict";
exports.__esModule = true;
var modules_1 = require("../../../../util/modules");
/**
 *
 */
var Trade = /** @class */ (function () {
    function Trade(player) {
        this.player = player;
        this.oPlayer = null;
        this.requestee = null;
        this.state = null;
        this.subState = null;
        this.playerItems = [];
        this.oPlayerItems = [];
    }
    Trade.prototype.start = function () {
        this.oPlayer = this.requestee;
        this.state = modules_1["default"].Trade.Started;
    };
    Trade.prototype.stop = function () {
        this.oPlayer = null;
        this.state = null;
        this.subState = null;
        this.requestee = null;
        this.playerItems = [];
        this.oPlayerItems = [];
    };
    Trade.prototype.finalize = function () {
        if (!this.player.inventory.containsSpaces(this.oPlayerItems.length))
            return;
        for (var i in this.oPlayerItems) {
            var item = this.oPlayerItems[i];
            if (!item || item.id === -1)
                continue;
            this.oPlayer.inventory.remove(item.id, item.count, item.index);
            this.player.inventory.add(item);
        }
    };
    Trade.prototype.select = function (slot) {
        var item = this.player.inventory.slots[slot];
        if (!item || item.id === -1 || this.playerItems.indexOf(item) < 0)
            return;
        this.playerItems.push(item);
    };
    Trade.prototype.request = function (oPlayer) {
        this.requestee = oPlayer;
        if (oPlayer.trade.getRequestee() === this.player.instance)
            this.start();
    };
    Trade.prototype.accept = function () {
        this.subState = modules_1["default"].Trade.Accepted;
        if (this.oPlayer.trade.subState === modules_1["default"].Trade.Accepted) {
            this.finalize();
            this.oPlayer.trade.finalize();
        }
    };
    Trade.prototype.getRequestee = function () {
        if (!this.requestee)
            return null;
        return this.requestee.instance;
    };
    Trade.prototype.decline = function () {
        this.stop();
    };
    Trade.prototype.isStarted = function () {
        return this.state !== null;
    };
    return Trade;
}());
exports["default"] = Trade;
