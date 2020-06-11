/* global module */

import Points from './points';

class Mana extends Points {

    manaCallback: Function;
    maxManaCallback: Function;

    constructor(mana: number, maxMana: number) {
        super(mana, maxMana);
    }

    setMana(mana: number) {
        this.points = mana;

        if (this.manaCallback)
            this.manaCallback();
    }

    setMaxMana(maxMana: number) {
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

    onMana(callback: Function) {
        this.manaCallback = callback;
    }

    onMaxMana(callback: Function) {
        this.maxManaCallback = callback;
    }

}

export default Mana;
