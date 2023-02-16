/* eslint-disable @typescript-eslint/no-unused-vars */

import type Collections from './collections';
import type Grids from '../../map/grids';
import type Map from '../../map/map';
import type Regions from '../../map/regions';
import type World from '../../world';
import type Entity from '../entity';

/**
 * An abstract used for a collection type. This is used by individual entity
 * types to determine how they should be loaded and spawned.
 */

export default abstract class Collection<EntityType extends Entity> {
    protected world: World;
    protected map: Map;
    protected regions: Regions;
    protected grids: Grids;

    protected entities: { [instance: string]: EntityType } = {};

    public constructor(public readonly collections: Collections) {
        this.world = collections.world;
        this.map = this.world.map;
        this.regions = this.world.map.regions;
        this.grids = this.world.map.grids;

        collections.register<Collection<EntityType>>(this);
    }

    /**
     * tryLoad is called when the entity is loaded. The collection will decide whether to do anything with it
     * You should override this method whenever you want to perform additional logic on this event.
     * @param position the position of the entity
     * @param key the name/id of the entity
     * @return entity Entity we are adding. or undefined when nothing happened
     */

    public tryLoad(position: Position, key: string): EntityType | undefined {
        return undefined;
    }

    /**
     * Creates the entity instance and adds it to its dictionary
     * @param params the params used to create a new object
     * @return entity Entity instance we are creating.
     */

    public spawn(params: { [key: string]: unknown } | undefined): EntityType | undefined {
        let entity = this.createEntity(params);
        if (entity) this.add(entity);

        return entity;
    }

    /**
     * Adds the entity instance to its dictionary and its
     * chest area if existent.
     * @return entity Entity instance we are adding.
     */

    public add(entity: EntityType): void {
        this.collections.allEntities.add(entity);

        this.entities[entity.instance] = entity;

        this.onAdd(entity);
    }

    /**
     * Removes the mob from our mob dictionary.
     * @param entity Entity we are removing.
     */

    public remove(entity: EntityType): void {
        this.collections.allEntities.remove(entity);
        if (this.shouldRemove(entity)) {
            this.onRemove(entity);

            delete this.entities[entity.instance];
        }
    }

    /**
     * onSpawn is called right after the entity is created via the spawn function
     * You should override this method whenever you want to perform additional logic on this event.
     * @param params the params used to create a new object
     * @return entity Entity we are adding.
     */

    public abstract createEntity(
        params: { [key: string]: unknown } | undefined
    ): EntityType | undefined;

    /**
     * By default we always remove entities when the remove method is called.
     * @param entity Entity we are evaluating to be removed.
     */

    protected shouldRemove(entity: EntityType): boolean {
        return true;
    }

    /**
     * Gets the keys of all entities
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

    /**
     * Gets an entity based on the username
     * @return entity
     */

    public get(username: string): Entity | undefined {
        return Object.values(this.entities).find((entity: EntityType) => {
            return entity.username.toLowerCase() === username.toLowerCase();
        });
    }

    /**
     * Gets a copied list of all entities in the collection
     */

    public getAll(): { [instance: string]: EntityType } {
        return { ...this.entities };
    }

    /**
     * Gets a list of all user names in the collection
     * @return list of usernames
     */

    public getUsernames(): string[] {
        return Object.values(this.entities).map((entity: EntityType) => entity.username);
    }

    /**
     * Perform a callback for each entity in the collection
     */

    public forEachEntity(callback: (entity: EntityType) => void) {
        for (let entity of Object.values(this.entities)) callback(entity);
    }

    /**
     * load is called when the entity needs to be loaded into the collection
     * You should override this method whenever you want to perform additional logic on this event.
     * @param entity Entity we are adding.
     */

    protected onAdd(entity: EntityType): void {
        // Nothing extra to do here
    }

    /**
     * onRemove is called when the entity is removed for this collection
     * You should override this method whenever you want to perform additional logic on this event.
     * @param entity Entity we are removing.
     */

    protected onRemove(entity: EntityType): void {
        // Nothing extra to do here
    }
}
