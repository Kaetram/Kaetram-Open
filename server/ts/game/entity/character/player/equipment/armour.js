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
var Armour = /** @class */ (function (_super) {
    __extends(Armour, _super);
    function Armour(name, id, count, ability, abilityLevel) {
        var _this = _super.call(this, name, id, count, ability, abilityLevel) || this;
        _this.defense = items_1["default"].getArmourLevel(name);
        return _this;
    }
    Armour.prototype.hasAntiStun = function () {
        return this.ability === 6;
    };
    Armour.prototype.setDefense = function (defense) {
        this.defense = defense;
    };
    Armour.prototype.getDefense = function () {
        return this.defense;
    };
    Armour.prototype.getType = function () {
        return modules_1["default"].Equipment.Armour;
    };
    return Armour;
}(equipment_1["default"]));
exports["default"] = Armour;
