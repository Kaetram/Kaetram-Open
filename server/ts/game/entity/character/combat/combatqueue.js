"use strict";
exports.__esModule = true;
var CombatQueue = /** @class */ (function () {
    function CombatQueue() {
        this.hitQueue = [];
    }
    CombatQueue.prototype.add = function (hit) {
        this.hitQueue.push(hit);
    };
    CombatQueue.prototype.hasQueue = function () {
        return this.hitQueue.length > 0;
    };
    CombatQueue.prototype.clear = function () {
        this.hitQueue = [];
    };
    CombatQueue.prototype.getHit = function () {
        if (this.hitQueue.length < 1)
            return;
        return this.hitQueue.shift().getData();
    };
    return CombatQueue;
}());
exports["default"] = CombatQueue;
