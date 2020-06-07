/* global module */

class Hit {

    constructor(type, damage) {
        let self = this;

        self.type = type;
        self.damage = damage;

        self.ranged = false;
        self.aoe = false;
        self.terror = false;
        self.poison = false;

    }

    isRanged() {
        return this.ranged;
    }

    isAoE() {
        return this.aoe;
    }

    isPoison() {
        return this.poison;
    }

    getDamage() {
        return this.damage;
    }

    getData() {
        return {
            type: this.type,
            damage: this.damage,
            isRanged: this.isRanged(),
            isAoE: this.isAoE(),
            hasTerror: this.terror,
            isPoison: this.poison
        }
    }

}

module.exports = Hit;
