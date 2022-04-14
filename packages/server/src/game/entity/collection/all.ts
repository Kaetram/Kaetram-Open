import { Modules } from '@kaetram/common/network';
import World from '@kaetram/server/src/game/world';
import Map from '@kaetram/server/src/game/map/map';
import Regions from '@kaetram/server/src/game/map/regions';
import Grids from '@kaetram/server/src/game/map/grids';
import Entity from '../entity';
import log from '@kaetram/common/util/log';
import { Despawn } from '@kaetram/server/src/network/packets';
import Character from '@kaetram/server/src/game/entity/character/character';
import _ from 'lodash';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class AllCollection {
    private map: Map;
    private regions: Regions;
    private grids: Grids;

    private entities: { [instance: string]: Entity } = {};

    public constructor(protected world: World) {
        this.map = world.map;
        this.regions = world.map.regions;
        this.grids = world.map.grids;
    }

    /**
     * Adds an entity to the list of entities. Whether it be a mob, player
     * npc, item, chest, etc. we keep track of them in the list of entities.
     */
    public add(entity: Entity): void {
        if (entity.instance in this.entities)
            log.warning(`Entity ${entity.instance} already exists.`);

        this.entities[entity.instance] = entity;

        this.regions.handle(entity);

        this.grids.addToEntityGrid(entity, entity.x, entity.y);
    }

    /**
     * Removes the entity from the entity dictionary and sends a despawn
     * callback to the nearby regions the entity is in.
     */
    public remove(entity: Entity): void {
        this.world.push(Modules.PacketType.Regions, {
            region: entity.region,
            packet: new Despawn(entity.instance)
        });

        // Remove the entity from the entity grid
        this.grids.removeFromEntityGrid(entity, entity.x, entity.y);

        // Remove the entity from the region it is in.
        this.regions.remove(entity);

        delete this.entities[entity.instance];

        if (entity.isPlayer()) this.world.cleanCombat(entity as Character);
    }

    /**
     * Gets an entity by key
     * @return Entity the entity
     */
    public get(instance: string): Entity {
        return this.entities[instance];
    }

    public forEachEntity(callback: (entity: Entity) => void): void {
        _.each(this.entities, callback);
    }

    /**
     * Gets the keys of all entities
     * @return amount Number
     */
    keys() {
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
