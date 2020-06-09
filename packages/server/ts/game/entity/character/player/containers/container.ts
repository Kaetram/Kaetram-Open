/* global module */

import _ from 'underscore';
    import Slot from './slot';
    import Items from '../../../../../util/items';
    import Constants from '../../../../../util/constants';

class Container {

    constructor(type, owner, size) {

        this.type = type;
        this.owner = owner;
        this.size = size;

        this.slots = [];

        for (let i = 0; i < this.size; i++)
            this.slots.push(new Slot(i));
    }

    load(ids, counts, abilities, abilityLevels) {

        /**
         * Fill each slot with manual data or the database
         */

        if (ids.length !== this.slots.length)
            log.error('[' + this.type + '] Mismatch in container size.');

        for (let i = 0; i < this.slots.length; i++)
            this.slots[i].load(ids[i], counts[i], abilities[i], abilityLevels[i]);
    }

    loadEmpty() {
        let data = [];

        for (let i = 0; i < this.size; i++)
            data.push(-1);

        this.load(data, data, data, data);
    }

    add(id, count, ability, abilityLevel) {

        //log.info('Trying to pickup ' + count + ' x ' + id);
        let maxStackSize = Items.maxStackSize(id) === -1 ? Constants.MAX_STACK : Items.maxStackSize(id);

        //log.info('Max stack size = ' + maxStackSize);

        if (!id || count < 0 || count > maxStackSize )
            return null;

        if (!Items.isStackable(id)) {
            if (this.hasSpace()) {
                let nsSlot = this.slots[this.getEmptySlot()]; //non-stackable slot

                nsSlot.load(id, count, ability, abilityLevel);

                return nsSlot;
            }
        } else {
            if (maxStackSize === -1 || this.type === 'Bank') {
                let sSlot = this.getSlot(id);

                if (sSlot) {
                    sSlot.increment(count);
                    return sSlot;
                } else {
                    if (this.hasSpace()) {
                        let slot = this.slots[this.getEmptySlot()];

                        slot.load(id, count, ability, abilityLevel);

                        return slot;

                    }
                }
            } else {

                let remainingItems = count;

                for (let i = 0; i < this.slots.length; i++) {
                    if (this.slots[i].id === id) {
                        let rSlot = this.slots[i];

                        let available = maxStackSize - rSlot.count;

                        if (available >= remainingItems) {

                            rSlot.increment(remainingItems);

                            return rSlot;
                        } else if (available > 0) {

                            rSlot.increment(available);
                            remainingItems -= available;

                        }

                    }
                }

                if (remainingItems > 0 && this.hasSpace()) {
                    let rrSlot = this.slots[this.getEmptySlot()];


                    rrSlot.load(id, remainingItems, ability, abilityLevel);

                    return rrSlot;
                }
            }
        }
    }

    canHold(id, count) {

        if (!Items.isStackable(id))
            return this.hasSpace();

        if (this.hasSpace())
            return true;

        let maxStackSize = Items.maxStackSize(id);

        if ((this.type === 'Bank' || maxStackSize === -1) && this.contains(id))
            return true;

        if (maxStackSize !== -1 && count > maxStackSize)
            return false;

        let remainingSpace = 0;

        for (let i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                remainingSpace += (maxStackSize - this.slots[i].count);

        return remainingSpace >= count;
    }

    remove(index, id, count) {
        /**
         * Perform item validity prior to calling the method.
         */

        let slot = this.slots[index];

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

        for (let i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                return this.slots[i];

        return null;
    }

    contains(id, count) {

        if (!count || count === 'undefined')
            count = 1;

        for (let index in this.slots) {
            let slot = this.slots[index];

            if (slot.id === id)
                return slot.count >= count;
        }

        return false;
    }

    containsSpaces(count) {
        let emptySpaces = [];

        for (let i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === -1)
                emptySpaces.push(this.slots[i]);

        return emptySpaces.length === count;
    }

    hasSpace() {
        return this.getEmptySlot() > -1;
    }

    getEmptySlot() {

        for (let i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === -1)
                return i;

        return -1;
    }

    getIndex(id) {

        /**
         * Used when the index is not determined,
         * returns the first item found based on the id.
         */

        for (let i = 0; i < this.slots.length; i++)
            if (this.slots[i].id === id)
                return i;

        return -1;
    }

    check() {

        _.each(this.slots, (slot) => {
            if (isNaN(slot.id))
                slot.empty();
        });
    }

    forEachSlot(callback) {

        for (let i = 0; i < this.slots.length; i++)
            callback(this.slots[i]);
    }

    getArray() {
        let ids = '',
            counts = '',
            abilities = '',
            abilityLevels = '';

        for (let i = 0; i < this.slots.length; i++) {
            ids += this.slots[i].id + ' ';
            counts += this.slots[i].count + ' ';
            abilities += this.slots[i].ability + ' ';
            abilityLevels += this.slots[i].abilityLevel + ' ';
        }

        return {
            username: this.owner.username,
            ids: ids.slice(0, -1),
            counts: counts.slice(0, -1),
            abilities: abilities.slice(0, -1),
            abilityLevels: abilityLevels.slice(0, -1)
        }
    }
}

export default Container;
