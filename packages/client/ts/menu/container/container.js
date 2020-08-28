import Slot from './slot';

export default class Container {
    constructor(size) {
        var self = this;

        self.size = size;

        self.slots = [];

        for (var i = 0; i < self.size; i++) self.slots.push(new Slot(i));
    }

    setSlot(index, info) {
        var self = this;

        /**
         * We receive information from the server here,
         * so we mustn't do any calculations. Instead,
         * we just modify the container directly.
         */

        self.slots[index].load(
            info.string,
            info.count,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable
        );
    }

    getEmptySlot() {
        var self = this;

        for (var i = 0; i < self.slots; i++) if (!self.slots[i].string) return i;

        return -1;
    }

    async getImageFormat(name) {
        return `url("${(await import(`../../../img/sprites/item-${name}.png`)).default}")`;
    }
}
