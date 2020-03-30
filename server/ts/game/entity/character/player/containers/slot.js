"use strict";
exports.__esModule = true;
var items_1 = require("../../../../../util/items");
/**
 *
 */
var Slot = /** @class */ (function () {
    function Slot(index) {
        this.index = index;
        this.id = -1;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;
        this.string = null;
    }
    Slot.prototype.load = function (id, count, ability, abilityLevel) {
        this.id = parseInt(id);
        this.count = parseInt(count);
        this.ability = parseInt(ability);
        this.abilityLevel = parseInt(abilityLevel);
        this.string = items_1["default"].idToString(this.id);
        this.edible = items_1["default"].isEdible(this.id);
        this.equippable = items_1["default"].isEquippable(this.string);
        this.verify();
    };
    Slot.prototype.empty = function () {
        this.id = -1;
        this.count = -1;
        this.ability = -1;
        this.abilityLevel = -1;
        this.string = null;
    };
    Slot.prototype.increment = function (amount) {
        this.count += parseInt(amount);
        this.verify();
    };
    Slot.prototype.decrement = function (amount) {
        this.count -= parseInt(amount);
        if (this.count < 1)
            console.error("[Slot] Item " + this.id + " has a count below 1 -> count: " + this.count);
        this.verify();
    };
    Slot.prototype.verify = function () {
        if (isNaN(this.count) || this.count < 1)
            this.count = 1;
    };
    Slot.prototype.getData = function () {
        return {
            index: this.index,
            string: this.string,
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel
        };
    };
    return Slot;
}());
exports["default"] = Slot;
