import Collection from './collection';

import Projectile from '../../entity/objects/projectile';

import type Character from '../../entity/character/character';
import type Hit from '../../entity/character/combat/hit';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ProjectileCollection extends Collection<Projectile> {
    public createEntity(params: { owner: Character; target: Character; hit: Hit }): Projectile {
        return new Projectile(params.owner, params.target, params.hit);
    }
}
