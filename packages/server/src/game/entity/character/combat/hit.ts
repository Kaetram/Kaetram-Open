import type * as Modules from '@kaetram/common/src/modules';

export interface HitData {
    type: Modules.Hits;
    damage: number;
    isRanged: boolean;
    isAoE: boolean;
    hasTerror: boolean;
    isPoison: boolean;
}

export default class Hit {
    ranged = false;
    aoe = false;
    terror = false;
    poison = false;

    constructor(public type: Modules.Hits, public damage: number) {}

    isRanged(): boolean {
        return this.ranged;
    }

    isAoE(): boolean {
        return this.aoe;
    }

    isPoison(): boolean {
        return this.poison;
    }

    getDamage(): number {
        return this.damage;
    }

    getData(): HitData {
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
