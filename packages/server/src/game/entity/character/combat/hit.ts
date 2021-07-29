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
    private ranged = false;
    private aoe = false;
    private terror = false;
    public poison = false;

    public constructor(public type: Modules.Hits, public damage: number) {}

    private isRanged(): boolean {
        return this.ranged;
    }

    private isAoE(): boolean {
        return this.aoe;
    }

    private isPoison(): boolean {
        return this.poison;
    }

    private getDamage(): number {
        return this.damage;
    }

    public getData(): HitData {
        return {
            type: this.type,
            damage: this.getDamage(),
            isRanged: this.isRanged(),
            isAoE: this.isAoE(),
            hasTerror: this.terror,
            isPoison: this.isPoison()
        };
    }
}
