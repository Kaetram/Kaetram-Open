"use strict";
exports.__esModule = true;
var _ = require("underscore");
var slot_1 = require("./slot");
var items_1 = require("../../../../../util/items");
var constants_1 = require("../../../../../util/constants");
/**
 *
 */
var Container = /** @class */ (function () {
    function Container(type, owner, size) {
        this.type = type;
        this.owner = owner;
        this.size = size;
        this.slots = [];
        for (var i = 0; i < this.size; i++)
            this.slots.push(new slot_1["default"](i));
    }
    Container.prototype.load = function (ids, counts, abilities, abilityLevels) {
        /**
         * Fill each slot with manual data or the database
         */
        if (ids.length !== this.slots.length)
            console.error("[" + this.type + "] Mismatch in container size.");
        for (var i = 0; i < this.slots.length; i++)
            this.slots[i].load(ids[i], counts[i], abilities[i], abilityLevels[i]);
    };
    Container.prototype.loadEmpty = function () {
        var data = [];
        for (var i = 0; i < this.size; i++)
            data.push(-1);
        this.load(data, data, data, data);
    };
    Container.prototype.add = function (id, count, ability, abilityLevel) {
        //
        console.info("Trying to pickup " + count + " x " + id);
        var maxStackSize = items_1["default"].maxStackSize(id) === -1
            ? constants_1["default"].MAX_STACK
            : items_1["default"].maxStackSize(id);
        //
        console.info("Max stack size = " + maxStackSize);
        if (!id || count < 0 || count > maxStackSize)
            return null;
        if (!items_1["default"].isStackable(id)) {
            if (this.hasSpace()) {
                var nsSlot = this.slots[this.getEmptySlot()]; // non-stackable slot
                nsSlot.load(id, count, ability, abilityLevel);
                return nsSlot;
            }
        }
        else if (maxStackSize === -1 || this.type === 'Bank') {
            var sSlot = this.getSlot(id);
            if (sSlot) {
                sSlot.increment(count);
                return sSlot;
            }
            if (this.hasSpace()) {
                var slot = this.slots[this.getEmptySlot()];
                slot.load(id, count, ability, abilityLevel);
                return slot;
            }
        }
        else {
            var remainingItems = count;
            for (var i = 0; i < this.slots.length; i++) {
                if (this.slots[i].id === id) {
                    var rSlot = this.slots[i];
                    var available = maxStackSize - rSlot.count;
                    if (available >= remainingItems) {
                        rSlot.increment(remainingItems);
                        return rSlot;
                    }
                    if (available > 0) {
                        rSlot.increment(available);
                        remainingItems -= available;
                    }
                }
            }
            if (remainingItems > 0 && this.hasSpace()) {
                var rrSlot = this.slots[this.getEmptySlot()];
                rrSlot.load(id, remainingItems, ability, abilityLevel);
                return rrSlot;
            }
        }
    };
    Container.prototype.canHold = function (id, count) {
        if (!items_1["default"].isStackable(id))
            return this.hasSpace();
        if (this.hasSpace())
            return true;
        var maxStackSize = items_1["default"].maxStackSize(id);
        if ((this.type === 'Bank' || maxStackSize === -1) && this.contains(id))
            return true;
        if (maxStackSize !== -1 && count > maxStackSize)
            return false;
        var remainingSpace = 0;
        for (var i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                remainingSpace += maxStackSize - this.slots[i].count;
        return remainingSpace >= count;
    };
    Container.prototype.remove = function (index, id, count) {
        /**
         * Perform item validity prior to calling the method.
         */
        var slot = this.slots[index];
        if (!slot)
            return false;
        if (items_1["default"].isStackable(id)) {
            if (count >= slot.count)
                slot.empty();
            else
                slot.decrement(count);
        }
        else
            slot.empty();
        return true;
    };
    Container.prototype.getSlot = function (id) {
        for (var i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                return this.slots[i];
        return null;
    };
    Container.prototype.contains = function (id, count) {
        if (!count || count === 'undefined')
            count = 1;
        for (var index in this.slots) {
            var slot = this.slots[index];
            if (slot.id === id)
                return slot.count >= count;
        }
        return false;
    };
    Container.prototype.containsSpaces = function (count) {
        var emptySpaces = [];
        for (var i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === -1)
                emptySpaces.push(this.slots[i]);
        return emptySpaces.length === count;
    };
    Container.prototype.hasSpace = function () {
        return this.getEmptySlot() > -1;
    };
    Container.prototype.getEmptySlot = function () {
        for (var i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === -1)
                return i;
        return -1;
    };
    Container.prototype.getIndex = function (id) {
        /**
         * Used when the index is not determined,
         * returns the first item found based on the id.
         */
        for (var i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                return i;
        return -1;
    };
    Container.prototype.check = function () {
        _.each(this.slots, function (slot) {
            if (isNaN(slot.id))
                slot.empty();
        });
    };
    Container.prototype.forEachSlot = function (callback) {
        for (var i = 0; i < this.slots.length; i++)
            callback(this.slots[i]);
    };
    Container.prototype.getArray = function () {
        var ids = '';
        var counts = '';
        var abilities = '';
        var abilityLevels = '';
        for (var i = 0; i < this.slots.length; i++) {
            ids += this.slots[i].id + " ";
            counts += this.slots[i].count + " ";
            abilities += this.slots[i].ability + " ";
            abilityLevels += this.slots[i].abilityLevel + " ";
        }
        return {
            username: this.owner.username,
            ids: ids.slice(0, -1),
            counts: counts.slice(0, -1),
            abilities: abilities.slice(0, -1),
            abilityLevels: abilityLevels.slice(0, -1)
        };
    };
    return Container;
}());
exports["default"] = Container;
