"use strict";
exports.__esModule = true;
var Hit = /** @class */ (function () {
    function Hit(type, damage) {
        this.type = type;
        this.damage = damage;
        this.ranged = false;
        this.aoe = false;
        this.terror = false;
        this.poison = false;
    }
    Hit.prototype.isRanged = function () {
        return this.ranged;
    };
    Hit.prototype.isAoE = function () {
        return this.aoe;
    };
    Hit.prototype.isPoison = function () {
        return this.poison;
    };
    Hit.prototype.getDamage = function () {
        return this.damage;
    };
    Hit.prototype.getData = function () {
        return {
            type: this.type,
            damage: this.damage,
            isRanged: this.isRanged(),
            isAoE: this.isAoE(),
            hasTerror: this.terror,
            isPoison: this.poison
        };
    };
    return Hit;
}());
exports["default"] = Hit;
