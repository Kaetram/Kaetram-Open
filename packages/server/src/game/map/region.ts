import _ from 'lodash';

import Entity from '../entity/entity';
import Player from '../entity/character/player/player';
import Area from './areas/area';

export default class Region {
    private entities: { [instance: string]: Entity } = {};
    private players: string[] = []; // A list of instance ids for players.
    private joining: Entity[] = []; // Used for sending spawn positions.
    private dynamicAreas: Area[] = [];

    public constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    /**
     * Adds the player's instance to the array.
     * We don't store player objects since that would be silly.
     */

    public addPlayer(player: Player): void {
        this.players.push(player.instance);
    }

    /**
     * Removes the player from the array. We could use for loops
     * and splice but this is cleaner.
     */

    public removePlayer(player: Player): void {
        this.players = _.reject(this.players, (instance: string) => {
            return instance === player.instance;
        });
    }

    /**
     * We add an entity to our list of entities.
     * @param entity Entity instance to add.
     */

    public addEntity(entity: Entity): void {
        this.entities[entity.instance] = entity;
    }

    /**
     * Removes an entity from our region.
     * @param entity The entity we are deleting.
     */

    public removeEntity(entity: Entity): void {
        delete this.entities[entity.instance];
    }

    /**
     * Takes an entity as a parameter and checks if the region contains that entity.
     * @param entity The entity we are checking the instance of.
     * @returns Boolean whether or not entity exists.
     */

    public hasEntity(entity: Entity): boolean {
        return entity.instance in this.entities;
    }

    /**
     * Adds an entity to the list of entities joining the region.
     */

    public addJoining(entity: Entity): void {
        if (!this.hasEntity(entity)) this.joining.push(entity);
    }

    /**
     * Adds a dynamic are to our region.
     * @param area The dynamic area we are adding.
     */

    public addDynamicArea(area: Area): void {
        this.dynamicAreas.push(area);
    }

    /**
     * Checks if there are any dynamic areas in the current region.
     * @returns Whether or not the length of dynamic area array is greater than 0.
     */

    public hasDynamicAreas(): boolean {
        return this.dynamicAreas.length > 0;
    }

    /**
     * Grab a list of entity instances and remove the `reject` from the list.
     * @param reject Entity that we are ignoring (typically a player).
     * @returns A list of entity instances.
     */

    public getEntities(reject?: Entity): string[] {
        let entities = _.keys(this.entities);

        if (reject)
            entities = _.reject(entities, (instance: string) => {
                return instance === reject.instance;
            });

        return entities;
    }

    /**
     * Checks if any entities are joining the area.
     */

    public isJoining(): boolean {
        return this.joining.length > 0;
    }

    /**
     * Clears the list of entities joining the area.
     */

    public clearJoining(): void {
        this.joining = [];
    }

    /**
     * Checks whether or not a position is within the area. The
     * x and y here are grid coordinates, not absolute values.
     */

    public inRegion(x: number, y: number): boolean {
        return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
    }

    /**
     * Iterates through the dynamic areas to see if the tile is contained
     * within it. This method is a lot faster than using the areas `inArea`
     * function.
     * @param x The x position of the tile in the grid space.
     * @param y The y position of the tile in the grid space.
     * @returns The area that contains the dynamic tile.
     */

    public getDynamicArea(x: number, y: number): Area | undefined {
        for (let area of this.dynamicAreas) if (area.contains(x, y)) return area;

        return undefined;
    }

    /**
     * Goes through each tile in the region and makes a callback.
     * @param callback Coordinate position of the tile.
     */

    public forEachTile(callback: (x: number, y: number) => void): void {
        for (let i = this.y; i < this.y + this.height; i++)
            for (let j = this.x; j < this.x + this.width; j++) callback(j, i);
    }

    /**
     * We iterate through the list of player instances. We correlate that
     * with each entity that we save in the region.
     */

    public forEachPlayer(callback: (player: Player) => void): void {
        _.each(this.players, (instance: string) => {
            if (instance in this.entities) callback(this.entities[instance] as Player);
        });
    }

    /**
     * Iterates through all the entities joining the region.
     */

    public forEachJoining(callback: (entity: Entity) => void): void {
        _.each(this.joining, callback);
    }
}
