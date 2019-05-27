/* global module */

let Points = require('./points');

class Mana extends Points {

    constructor(mana, maxMana) {
        super(mana, maxMana);
    }

    setMana(mana) {
        let self = this;

        self.points = mana;

        if (self.manaCallback)
            self.manaCallback();
    }

    setMaxMana(maxMana) {
        let self = this;

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