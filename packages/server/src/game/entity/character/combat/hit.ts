import { Modules } from '@kaetram/common/network';

import type { HitData } from '@kaetram/common/types/info';

export default class Hit {
    public constructor(
        public type: Modules.Hits,
        private damage = 0,
        private ranged = false,
        public aoe = 0,
        private magic = false,
        private archery = false,
        private attackStyle?: Modules.AttackStyle
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
     * @returns Whether or not the hit is ranged.
     */

    public getSkill(): string[] {
        if (this.magic) return ['magic'];

        if (this.archery) return ['archery'];

        if (this.attackStyle !== Modules.AttackStyle.None)
            switch (this.attackStyle) {
                case Modules.AttackStyle.Stab: {
                    return ['accuracy'];
                }

                case Modules.AttackStyle.Slash: {
                    return ['strength'];
                }

                case Modules.AttackStyle.Defensive: {
                    return ['defense'];
                }

                case Modules.AttackStyle.Crush: {
                    return ['accuracy', 'strength'];
                }

                case Modules.AttackStyle.Shared: {
                    return ['accuracy', 'strength', 'defense'];
                }

                case Modules.AttackStyle.Hack: {
                    return ['strength', 'defense'];
                }

                case Modules.AttackStyle.Chop: {
                    return ['accuracy', 'defense'];
                }
            }

        if (this.type === Modules.Hits.Normal) return ['accuracy'];

        return [];
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
            aoe: this.aoe,
            skills: this.getSkill()
        };
    }
}
