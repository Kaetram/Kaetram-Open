import type { Modules } from '@kaetram/common/network';
import type { HitData } from '@kaetram/common/types/info';

export default class Hit {
    public constructor(
        public type: Modules.Hits,
        private damage = 0,
        private ranged = false,
        public aoe = 0
    ) {}

    /**
     * @returns The damage integer of the hit.
     */

    public getDamage(): number {
        return this.damage;
    }

    /**
     * @returns Whether or not the hit is an aoe.
     */

    public isAoE(): boolean {
        return this.aoe > 0;
    }

    /**
     * Serializes the Hit object and converts
     * it into a JSON object.
     */

    public serialize(): HitData {
        return {
            type: this.type,
            damage: this.damage,
            ranged: this.ranged,
            aoe: this.aoe
        };
    }
}
