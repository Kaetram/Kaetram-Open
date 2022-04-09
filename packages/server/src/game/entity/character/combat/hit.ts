import type { Modules } from '@kaetram/common/network';
import type { HitData } from '@kaetram/common/types/info';

export default class Hit {
    public constructor(
        public type: Modules.Hits,
        private damage = 0,
        private ranged = false,
        private aoe = false,
        private poison = false,
        private terror = false
    ) {}

    /**
     * Serializes the Hit object and converts
     * it into a JSON object.
     */

    public serialize(): HitData {
        return {
            type: this.type,
            damage: this.damage,
            ranged: this.ranged,
            aoe: this.aoe,
            poison: this.poison,
            terror: this.terror
        };
    }
}
