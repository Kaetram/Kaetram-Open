/* global module */

class Hit {
    constructor(type, damage) {
        let self = this;

        self.type = type;
        self.damage = damage;

        self.ranged = false;
        self.aoe = false;
        self.terror = false;
    }

    isRanged() {
        return this.ranged;
    }

    isAoE() {
        return this.aoe;
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
            hasTerror: this.terror
        };
    }
}

module.exports = Hit;
