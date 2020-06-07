/* global module */

let Items = require('../../../../../util/items');

class Slot {

    constructor(index) {
        let self = this;

        self.index = index;

        self.id = -1;
        self.count = -1;
        self.ability = -1;
        self.abilityLevel = -1;

        self.string = null;
    }

    load(id, count, ability, abilityLevel) {
        let self = this;

        self.id = parseInt(id);
        self.count = parseInt(count);
        self.ability = parseInt(ability);
        self.abilityLevel = parseInt(abilityLevel);

        self.string = Items.idToString(self.id);
        self.edible = Items.isEdible(self.id);
        self.equippable = Items.isEquippable(self.string);

        self.verify();
    }

    empty() {
        let self = this;

        self.id = -1;
        self.count = -1;
        self.ability = -1;
        self.abilityLevel = -1;

        self.string = null;
    }

    increment(amount) {
        let self = this;

        self.count += parseInt(amount);

        self.verify();
    }

    decrement(amount) {
        let self = this;

        self.count -= parseInt(amount);

        if (self.count < 1)
            log.error('[Slot] Item ' + self.id + ' has a count below 1 -> count: ' + self.count);

        self.verify();
    }

    verify() {
        let self = this;

        if (isNaN(self.count) || self.count < 1)
            self.count = 1;
    }

    getData() {
        return {
            index: this.index,
            string: this.string,
            count: this.count,
            ability: this.ability,
            abilityLevel: this.abilityLevel
        }
    }

}

module.exports = Slot;
