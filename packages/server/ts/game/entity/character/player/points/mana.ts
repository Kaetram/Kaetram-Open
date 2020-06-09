/* global module */

let Points = require('./points');

class Mana extends Points {

    constructor(mana, maxMana) {
        super(mana, maxMana);
    }

    setMana(mana) {
        this.points = mana;

        if (this.manaCallback)
            this.manaCallback();
    }

    setMaxMana(maxMana) {
        this.maxPoints = maxMana;

        if (this.maxManaCallback)
            this.maxManaCallback();
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

export default Mana;
