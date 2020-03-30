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
var Projectile = /** @class */ (function (_super) {
    __extends(Projectile, _super);
    function Projectile(id, instance) {
        var _this = _super.call(this, id, 'projectile', instance) || this;
        _this.startX = -1;
        _this.startY = -1;
        _this.destX = -1;
        _this.destY = -1;
        _this.target = null;
        _this.damage = -1;
        _this.hitType = null;
        _this.owner = null;
        return _this;
    }
    Projectile.prototype.setStart = function (x, y) {
        this.x = x;
        this.y = y;
    };
    /**
     * TODO: Merge setTarget() && setStaticTarget into one function.
     */
    Projectile.prototype.setTarget = function (target) {
        this.target = target;
        this.destX = target.x;
        this.destY = target.y;
    };
    Projectile.prototype.setStaticTarget = function (x, y) {
        this.static = true;
        this.destX = x;
        this.destY = y;
    };
    Projectile.prototype.getData = function () {
        /**
         * Refrain from creating a projectile unless
         * an owner and a target are available.
         */
        if (!this.owner || !this.target)
            return;
        return {
            id: this.instance,
            name: this.owner.projectileName,
            characterId: this.owner.instance,
            targetId: this.target.instance,
            damage: this.damage,
            special: this.special,
            hitType: this.hitType,
            type: this.type
        };
    };
    return Projectile;
}(entity_1["default"]));
exports["default"] = Projectile;
