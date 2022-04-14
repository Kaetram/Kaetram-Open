import World from '@kaetram/server/src/game/world';
import Map from '@kaetram/server/src/game/map/map';
import Regions from '@kaetram/server/src/game/map/regions';
import Grids from '@kaetram/server/src/game/map/grids';
import Entity from '../entity';
import _ from 'lodash';
import AllCollection from '@kaetram/server/src/game/entity/collection/all';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default abstract class Collection<EntityType extends Entity> {
    protected map: Map;
    protected regions: Regions;
    protected grids: Grids;

    protected entities: { [instance: string]: EntityType } = {};

    public constructor(protected world: World, protected allEntities: AllCollection) {
        this.map = world.map;
        this.regions = world.map.regions;
        this.grids = world.map.grids;
    }

    /**
     * Creates the entity instance and adds it to its dictionary
     * @param params the params used to create a new object
     * @return entity Entity instance we are creating.
     */
    spawn(params: Record<string, unknown> | undefined): EntityType | undefined {
        let entity = this.onSpawn(params);
        if (entity) this.add(entity);

        return entity;
    }

    /**
     * Adds the entity instance to its dictionary and its
     * chest area if existent.
     * @return entity Entity instance we are adding.
     */
    add(entity: EntityType): void {
        this.allEntities.add(entity);

        this.entities[entity.instance] = entity;

        this.onAdd(entity);
    }

    /**
     * Removes the mob from our mob dictionary.
     * @param entity Entity we are removing.
     */
    remove(entity: EntityType): void {
        this.allEntities.remove(entity);
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
    abstract onSpawn(params: Record<string, unknown> | undefined): EntityType | undefined;

    /**
     * onAdd is called when the entity is added to this collection.
     * You should override this method whenever you want to perform additional logic on this event.
     * @param entity Entity we are adding.
     */
    protected onAdd(entity: EntityType) {
        // Nothing extra to do here
    }

    /**
     * By default we always remove entities when the remove method is called.
     * @param entity Entity we are evaluating to be removed.
     */
    protected shouldRemove(entity: EntityType) {
        return true;
    }

    /**
     * onRemove is called when the entity is removed for this collection
     * You should override this method whenever you want to perform additional logic on this event.
     * @param entity Entity we are removing.
     */
    protected onRemove(entity: EntityType) {
        // Nothing extra to do here
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

    /**
     * Gets an entity based on the username
     * @return entity
     */
    get(username: string) {
        return _.find(this.entities, (entity: EntityType) => {
            return entity.username.toLowerCase() === username.toLowerCase();
        });
    }

    /**
     * Gets a list of all user names in the collection
     * @return list of usernames
     */
    getUsernames(): string[] {
        return _.map(this.entities, (entity: EntityType) => entity.username);
    }

    /**
     * Perform a callback for each entity in the collection
     */
    forEachEntity(callback: (entity: EntityType) => void) {
        _.each(this.entities, callback);
    }

    /**
     * Gets a copied list of all entities in the collection
     */
    getAll(): { [instance: string]: EntityType } {
        return { ...this.entities };
    }
}
