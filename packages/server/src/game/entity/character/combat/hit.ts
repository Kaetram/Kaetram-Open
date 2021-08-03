import type { Modules } from '@kaetram/common/network';
import type { HitData } from '@kaetram/common/types/info';

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
