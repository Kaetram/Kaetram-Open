import { Modules } from '@kaetram/common/network';

import Entity, { EntityData } from '../entity';

import Hit from '../character/combat/hit';
import Character from '../character/character';
import Utils from '@kaetram/common/util/utils';

export default class Projectile extends Entity {
    public hitType = Modules.Hits.Damage;

    public constructor(public owner: Character, public target: Character, public hit: Hit) {
        super(Utils.createInstance(Modules.EntityType.Projectile), 'projectile', owner.x, owner.y);

        this.key = owner.projectileName;
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
        data.damage = this.hit.getDamage() || 0;
        data.hitType = this.hitType;

        return data;
    }
}
