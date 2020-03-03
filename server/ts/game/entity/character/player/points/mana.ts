/** @format */

import Points from './points';

class Mana extends Points {
    public points: any;
    public maxPoints: any;
    public manaCallback: any;
    public maxManaCallback: any;

    constructor(mana, maxMana) {
        super(mana, maxMana);
    }

    setMana(mana) {
        this.points = mana;

        if (this.manaCallback) this.manaCallback();
    }

    setMaxMana(maxMana) {
        this.maxPoints = maxMana;

        if (this.maxManaCallback) this.maxManaCallback();
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
