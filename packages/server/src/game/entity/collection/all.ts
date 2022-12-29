import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import { Despawn } from '@kaetram/server/src/network/packets';
import _ from 'lodash-es';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Collections from '@kaetram/server/src/game/entity/collection/collections';
import type Grids from '@kaetram/server/src/game/map/grids';
import type Map from '@kaetram/server/src/game/map/map';
import type Regions from '@kaetram/server/src/game/map/regions';
import type World from '@kaetram/server/src/game/world';
import type Entity from '../entity';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class AllCollection {
    private world: World;
    private map: Map;
    private regions: Regions;
    private grids: Grids;

    private entities: { [instance: string]: Entity } = {};

    public constructor(public readonly collections: Collections) {
        this.world = collections.world;
        this.map = this.world.map;
        this.regions = this.world.map.regions;
        this.grids = this.world.map.grids;
    }

    /**
     * Adds an entity to the list of entities. Whether it be a mob, player
     * npc, item, chest, etc. we keep track of them in the list of entities.
     * @param entity The entity we are adding into region/grid system.
     */
    public add(entity: Entity): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        if (entity.isProjectile()) return;

        this.regions.handle(entity);

        this.grids.addToEntityGrid(entity);
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     * @param entity The entity we are removing.
     */

    public remove(entity: Entity): void {
        this.world.push(Modules.PacketType.Regions, {
            region: entity.region,
            packet: new Despawn({
                instance: entity.instance
            })
        });

        // Remove the entity from the entity grid
        this.grids.removeFromEntityGrid(entity);

        // Remove the entity from the region it is in.
        this.regions.remove(entity);

        delete this.entities[entity.instance];

        // Clean combat when removing a player.
        if (entity.isPlayer()) this.world.cleanCombat(entity as Character);
    }

    /**
     * Gets an entity by key.
     * @return The instance of the entity we are finding.
     */

    public get(instance: string): Entity {
        return this.entities[instance];
    }

    /**
     * Iterates through all the entities and creates a callback for the entity.
     * @param callback Contains a entity that is being iterated.
     */

    public forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, callback);
    }

    /**
     * Gets the keys of all entities.
     * @return amount Number
     */

    public keys(): string[] {
        return Object.keys(this.entities);
    }

    /**
     * Gets the amount of entities
     * @return amount Number
     */

    public get length(): number {
        return this.keys().length;
    }
}
