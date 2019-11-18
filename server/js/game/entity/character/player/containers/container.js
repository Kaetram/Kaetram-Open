/* global module */

const _ = require('underscore'),
    Slot = require('./slot'),
    Items = require('../../../../../util/items'),
    Constants = require('../../../../../util/constants');

class Container {
    constructor(type, owner, size) {
        const self = this;

        self.type = type;
        self.owner = owner;
        self.size = size;

        self.slots = [];

        for (let i = 0; i < self.size; i++)
            self.slots.push(new Slot(i));
    }

    load(ids, counts, abilities, abilityLevels) {
        const self = this;

        /**
         * Fill each slot with manual data or the database
         */

        if (ids.length !== self.slots.length)
            log.error('[' + self.type + '] Mismatch in container size.');

        for (let i = 0; i < self.slots.length; i++)
            self.slots[i].load(ids[i], counts[i], abilities[i], abilityLevels[i]);
    }

    loadEmpty() {
        const self = this,
            data = [];

        for (let i = 0; i < self.size; i++)
            data.push(-1);

        self.load(data, data, data, data);
    }

    add(id, count, ability, abilityLevel) {
        const self = this;

        // log.info('Trying to pickup ' + count + ' x ' + id);
        const maxStackSize = Items.maxStackSize(id) === -1 ? Constants.MAX_STACK : Items.maxStackSize(id);

        // log.info('Max stack size = ' + maxStackSize);

        if (!id || count < 0 || count > maxStackSize)
            return null;

        if (!Items.isStackable(id)) {
            if (self.hasSpace()) {
                const nsSlot = self.slots[self.getEmptySlot()]; // non-stackable slot

                nsSlot.load(id, count, ability, abilityLevel);

                return nsSlot;
            }
        } else {
            if (maxStackSize === -1 || self.type === 'Bank') {
                const sSlot = self.getSlot(id);

                if (sSlot) {
                    sSlot.increment(count);
                    return sSlot;
                } else {
                    if (self.hasSpace()) {
                        const slot = self.slots[self.getEmptySlot()];

                        slot.load(id, count, ability, abilityLevel);

                        return slot;
                    }
                }
            } else {
                let remainingItems = count;

                for (let i = 0; i < self.slots.length; i++) {
                    if (self.slots[i].id === id) {
                        const rSlot = self.slots[i];

                        const available = maxStackSize - rSlot.count;

                        if (available >= remainingItems) {
                            rSlot.increment(remainingItems);

                            return rSlot;
                        } else if (available > 0) {
                            rSlot.increment(available);
                            remainingItems -= available;
                        }
                    }
                }

                if (remainingItems > 0 && self.hasSpace()) {
                    const rrSlot = self.slots[self.getEmptySlot()];


                    rrSlot.load(id, remainingItems, ability, abilityLevel);

                    return rrSlot;
                }
            }
        }
    }

    canHold(id, count) {
        const self = this;

        if (!Items.isStackable(id))
            return self.hasSpace();

        if (self.hasSpace())
            return true;

        const maxStackSize = Items.maxStackSize(id);

        if ((self.type === 'Bank' || maxStackSize === -1) && self.contains(id))
            return true;

        if (maxStackSize !== -1 && count > maxStackSize)
            return false;

        let remainingSpace = 0;

        for (let i = 0; i < self.slots.length; i++) {
            if (self.slots[i].id === id)
                remainingSpace += (maxStackSize - self.slots[i].count);
        }

        return remainingSpace >= count;
    }

    remove(index, id, count) {
        /**
         * Perform item validity prior to calling the method.
         */

        const self = this,
            slot = self.slots[index];

        if (!slot)
            return false;

        if (Items.isStackable(id)) {
            if (count >= slot.count)
                slot.empty();
            else
                slot.decrement(count);
        } else
            slot.empty();

        return true;
    }

    getSlot(id) {
        const self = this;

        for (let i = 0; i < self.slots.length; i++) {
            if (self.slots[i].id === id)
                return self.slots[i];
        }

        return null;
    }

    contains(id, count) {
        const self = this;

        if (!count || count === 'undefined')
            count = 1;

        for (const index in self.slots) {
            const slot = self.slots[index];

            if (slot.id === id)
                return slot.count >= count;
        }

        return false;
    }

    containsSpaces(count) {
        const self = this,
            emptySpaces = [];

        for (let i = 0; i < self.slots.length; i++) {
            if (self.slots[i].id === -1)
                emptySpaces.push(self.slots[i]);
        }

        return emptySpaces.length === count;
    }

    hasSpace() {
        return this.getEmptySlot() > -1;
    }

    getEmptySlot() {
        const self = this;

        for (let i = 0; i < self.slots.length; i++) {
            if (self.slots[i].id === -1)
                return i;
        }

        return -1;
    }

    getIndex(id) {
        const self = this;

        /**
         * Used when the index is not determined,
         * returns the first item found based on the id.
         */

        for (let i = 0; i < self.slots.length; i++) {
            if (self.slots[i].id === id)
                return i;
        }

        return -1;
    }

    check() {
        const self = this;

        _.each(self.slots, slot => {
            if (isNaN(slot.id))
                slot.empty();
        });
    }

    forEachSlot(callback) {
        const self = this;

        for (let i = 0; i < self.slots.length; i++)
            callback(self.slots[i]);
    }

    getArray() {
        let self = this,
            ids = '',
            counts = '',
            abilities = '',
            abilityLevels = '';

        for (let i = 0; i < self.slots.length; i++) {
            ids += self.slots[i].id + ' ';
            counts += self.slots[i].count + ' ';
            abilities += self.slots[i].ability + ' ';
            abilityLevels += self.slots[i].abilityLevel + ' ';
        }

        return {
            username: self.owner.username,
            ids: ids.slice(0, -1),
            counts: counts.slice(0, -1),
            abilities: abilities.slice(0, -1),
            abilityLevels: abilityLevels.slice(0, -1)
        };
    }
}

module.exports = Container;
