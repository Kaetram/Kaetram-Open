import mobData from '@kaetram/server/data/mobs.json';
import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Collection from '@kaetram/server/src/game/entity/collection/collection';

import type World from '@kaetram/server/src/game/world';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class MobCollection extends Collection<Mob> {
    public override tryLoad(position: Position, key: string): Mob | undefined {
        if (!(key in mobData)) return undefined;
        return this.spawn({ world: this.world, key, x: position.x, y: position.y });
    }

    public createEntity(params: {
        world: World;
        key: string;
        x: number;
        y: number;
        plugin: boolean;
    }): Mob {
        return new Mob(params.world, params.key, params.x, params.y, params.plugin);
    }

    public override onAdd(entity: Mob): void {
        entity.addToChestArea(this.map.getChestAreas());
    }
}
