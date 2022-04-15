import World from '@kaetram/server/src/game/world';
import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Collection from '@kaetram/server/src/game/entity/collection/collection';
import mobData from '@kaetram/server/data/mobs.json';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class MobCollection extends Collection<Mob> {
    override tryLoad(position: Position, key: string): Mob | undefined {
        if (!(key in mobData)) return undefined;
        return this.spawn({ world: this.world, key, x: position.x, y: position.y });
    }

    createEntity(params: { world: World; key: string; x: number; y: number }): Mob {
        return new Mob(params.world, params.key, params.x, params.y);
    }

    override onAdd(entity: Mob): void {
        entity.addToChestArea(this.map.getChestAreas());
    }
}
