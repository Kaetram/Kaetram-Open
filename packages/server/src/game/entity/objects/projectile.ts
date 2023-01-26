import Entity from '../entity';

import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type { EntityData } from '@kaetram/common/types/entity';
import type Character from '../character/character';
import type Hit from '../character/combat/hit';

export default class Projectile extends Entity {
    public hitType = Modules.Hits.Damage;
    private impactCallback?: () => void;

    public constructor(public owner: Character, public target: Character, public hit: Hit) {
        super(
            Utils.createInstance(Modules.EntityType.Projectile),
            owner.getProjectileName(),
            owner.x,
            owner.y
        );

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
        data.damage = this.hit.getDamage() || 0;
        data.hitType = this.hitType;

        return data;
    }

    /**
     * Callback for when the projectile impacts the target.
     */

    public onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
