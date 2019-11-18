/* global module */

const Points = require('./points');

class Mana extends Points {
    constructor(mana, maxMana) {
        super(mana, maxMana);
    }

    setMana(mana) {
        const self = this;

        self.points = mana;

        if (self.manaCallback)
            self.manaCallback();
    }

    setMaxMana(maxMana) {
        const self = this;

        self.maxPoints = maxMana;

        if (self.maxManaCallback)
            self.maxManaCallback();
    }

    getMana() {
        return this.points;
    }

    getMaxMana() {
        return this.maxPoints;
    }

    onMana(callback) {
        this.manaCallback = callback;
    }

    onMaxMana(callback) {
        this.maxManaCallback = callback;
    }
}

module.exports = Mana;
