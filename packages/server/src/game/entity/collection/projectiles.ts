import Collection from '@kaetram/server/src/game/entity/collection/collection';
import Projectile from '@kaetram/server/src/game/entity/objects/projectile';
import Character from '@kaetram/server/src/game/entity/character/character';
import Hit from '@kaetram/server/src/game/entity/character/combat/hit';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ProjectileCollection extends Collection<Projectile> {
    createEntity(params: { owner: Character; target: Character; hit: Hit }): Projectile {
        return new Projectile(params.owner, params.target, params.hit);
    }
}
