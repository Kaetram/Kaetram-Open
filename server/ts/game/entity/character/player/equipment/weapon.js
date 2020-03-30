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
var equipment_1 = require("./equipment");
var items_1 = require("../../../../../util/items");
var modules_1 = require("../../../../../util/modules");
/**
 *
 */
var Weapon = /** @class */ (function (_super) {
    __extends(Weapon, _super);
    function Weapon(name, id, count, ability, abilityLevel) {
        var _this = _super.call(this, name, id, count, ability, abilityLevel) || this;
        _this.level = items_1["default"].getWeaponLevel(name);
        _this.ranged = items_1["default"].isArcherWeapon(name);
        _this.breakable = false;
        return _this;
    }
    Weapon.prototype.getBaseAmplifier = function () {
        var base = _super.prototype.getBaseAmplifier.call(this);
        return base + 0.05 * this.abilityLevel;
    };
    Weapon.prototype.hasCritical = function () {
        return this.ability === 1;
    };
    Weapon.prototype.hasExplosive = function () {
        return this.ability === 4;
    };
    Weapon.prototype.hasStun = function () {
        return this.ability === 5;
    };
    Weapon.prototype.isRanged = function () {
        return this.ranged;
    };
    Weapon.prototype.setLevel = function (level) {
        this.level = level;
    };
    Weapon.prototype.getLevel = function () {
        return this.level;
    };
    Weapon.prototype.getType = function () {
        return modules_1["default"].Equipment.Weapon;
    };
    return Weapon;
}(equipment_1["default"]));
exports["default"] = Weapon;
