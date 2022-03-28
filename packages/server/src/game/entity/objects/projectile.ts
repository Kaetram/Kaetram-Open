import { Modules } from '@kaetram/common/network';

import Entity, { EntityData } from '../entity';

import type Character from '../character/character';
import Utils from '@kaetram/common/util/utils';

export default class Projectile extends Entity {
    public damage = -1;

    public hitType = Modules.Hits.Damage;

    public constructor(
        key: Modules.Projectiles,
        public owner: Character,
        public target: Character
    ) {
        super(Utils.createInstance(Modules.EntityType.Projectile), 'projectile', owner.x, owner.y);
    }

    /**
     * Adds the projectile information onto the entity data superclass.
     * @returns Serialized `ProjectileData` in conjunction with `EntityData`.
     */

    public override serialize(): EntityData {
        let data = super.serialize();

        data.name = this.owner.projectileName;
        data.ownerInstance = this.owner.instance;
        data.targetInstance = this.target.instance;
        data.damage = this.damage;
        data.hitType = this.hitType;

        return data;
    }
}
