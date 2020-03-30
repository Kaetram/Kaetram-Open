class Hit {
    public ranged: any;

    public aoe: any;

    public poison: any;

    public terror: any;

    constructor(public type: number, public damage: number) {
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
            isPoison: this.poison
        };
    }
}

export default Hit;
