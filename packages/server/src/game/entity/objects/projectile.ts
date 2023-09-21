import Entity from '../entity';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Hit from '../character/combat/hit';
import type Character from '../character/character';
import type { EntityData } from '@kaetram/common/types/entity';

export default class Projectile extends Entity {
    private impactCallback?: () => void;

    public constructor(
        public owner: Character,
        public target: Character,
        public hit: Hit
    ) {
        super(
            Utils.createInstance(Modules.EntityType.Projectile),
            owner.getProjectileName(),
            owner.x,
            owner.y
        );

        // Apply the terror hit type if the projectile is a terror projectile.
        if (this.key === 'terror') this.hit.type = Modules.Hits.Terror;

        // Apply the terorr projectile if the hit type is terror.
        if (this.hit.type === Modules.Hits.Terror) this.key = 'terror';

        /**
         * The rough speed of the projectile is 1 tile per 100ms, so we use that
         * to calculate the approximate time it takes for impact to occur.
         */

        setTimeout(this.handleImpact.bind(this), this.owner.getDistance(this.target) * 90);
    }

    /**
     * Handles the impact of the projectile with its target. We do this server-sided
     * since we cannot rely on the client to send us the correct information.
     */

    private handleImpact(): void {
        this.target?.hit(this.hit.getDamage(), this.owner, this.hit.aoe);

        // Updates the status effect based on the hit type.
        this.target?.addStatusEffect(this.hit);

        // Despawn callback.
        this.impactCallback?.();
    }

    /**
     * Adds the projectile information onto the entity data superclass.
     * @returns Serialized `ProjectileData` in conjunction with `EntityData`.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.ownerInstance = this.owner.instance;
        data.targetInstance = this.target.instance;
        data.hit = this.hit.serialize();

        return data;
    }

    /**
     * Callback for when the projectile impacts the target.
     */

    public onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
