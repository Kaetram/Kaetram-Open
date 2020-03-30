"use strict";
exports.__esModule = true;
var items_1 = require("../../../../../util/items");
/**
 *
 */
var Equipment = /** @class */ (function () {
    function Equipment(name, id, count, ability, abilityLevel) {
        this.name = name;
        this.id = id;
        this.count = count || 0;
        this.ability = !isNaN(ability) ? ability : -1;
        this.abilityLevel = !isNaN(abilityLevel) ? abilityLevel : -1;
    }
    Equipment.prototype.getName = function () {
        return this.name;
    };
    Equipment.prototype.getId = function () {
        return this.id;
    };
    Equipment.prototype.getCount = function () {
        return this.count;
    };
    Equipment.prototype.getAbility = function () {
        return this.ability;
    };
    Equipment.prototype.getAbilityLevel = function () {
        return this.abilityLevel;
    };
    Equipment.prototype.getBaseAmplifier = function () {
        return 1.0;
    };
    Equipment.prototype.getType = function () {
        return -1;
    };
    Equipment.prototype.getData = function () {
        return {
            type: this.getType(),
            name: items_1["default"].idToName(this.id),
            string: items_1["default"].idToString(this.id),
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel,
            power: items_1["default"].getLevelRequirement(this.name)
        };
    };
    Equipment.prototype.getString = function () {
        return items_1["default"].idToString(this.id);
    };
    Equipment.prototype.getItem = function () {
        return {
            name: this.name,
            string: items_1["default"].idToString(this.id),
            id: this.id,
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel
        };
    };
    return Equipment;
}());
exports["default"] = Equipment;
