/* global module */

class Hit {
    type: any;
    damage: number;

    ranged: boolean;
    aoe: boolean;
    terror: boolean;
    poison: boolean;

    constructor(type: any, damage: number) {
        this.type = type;
        this.damage = damage;

        this.ranged = false;
        this.aoe = false;
        this.terror = false;
        this.poison = false;
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
            isPoison: this.poison,
        };
    }
}

export default Hit;
