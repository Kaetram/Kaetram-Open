import type { RegionTileData } from '@kaetram/common/types/map';
import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Light from '../globals/impl/light';
import type Resource from '../globals/impl/resource';
import type Area from './areas/area';

export default class Region {
    public data: RegionTileData[] = [];

    private entities: { [instance: string]: Entity } = {};
    private players: string[] = []; // A list of instance ids for players.
    private joining: Entity[] = []; // Used for sending spawn positions.
    private dynamicAreas: Area[] = [];
    private resources: Resource[] = [];
    private lights: Light[] = [];

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
        this.players = this.players.filter((instance: string) => {
            return instance !== player.instance;
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
     * Adds a resource to the region.
     * @param resource The resource we are adding to the region.
     */

    public addResource(resource: Resource): void {
        this.resources.push(resource);
    }

    /**
     * @returns If the amount of resources in the array is greater than 0.
     */

    public hasResources(): boolean {
        return this.resources.length > 0;
    }

    /**
     * Adds a light object to the region.
     * @param light The light object we are adding.
     */

    public addLight(light: Light): void {
        this.lights.push(light);
    }

    /**
     * Grab a list of entity instances and remove the `reject` from the list.
     * @param player Player object used to check dynamic visibility of the entities.
     * @param reject Entity that we are ignoring (typically a player).
     * @returns A list of entity instances.
     */

    public getEntities(player: Player, reject?: Entity): string[] {
        let entities: string[] = [];

        for (let instance in this.entities) {
            // Ignore if a reject is present.
            if (reject && reject.instance === instance) continue;

            // Check if the entity is visible to the player.
            if (!this.entities[instance].isVisible(player)) continue;

            // Append our instance to the list.
            entities.push(instance);
        }

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
            for (let j = this.x; j < this.x + this.width; j++)
                if (!this.getDynamicArea(j, i)) callback(j, i);
    }

    /**
     * Iterates through the dynamic areas and returns each tile within that area.
     * @param callback The tile coordinate.
     */

    public forEachDynamicTile(callback: (x: number, y: number, area: Area) => void): void {
        for (let area of this.dynamicAreas)
            area.forEachTile((x: number, y: number) => callback(x, y, area));
    }

    /**
     * Iterates through all the entities in the region and returns it.
     * @param callback Entity that is currently being iterated.
     */

    public forEachEntity(callback: (entity: Entity) => void): void {
        for (let entity of Object.values(this.entities)) callback(entity);
    }

    /**
     * Iterates through all the resources and returns each resource.
     * @param callback Resource that is being iterated.
     */

    public forEachResource(callback: (resource: Resource) => void): void {
        for (let resource of this.resources) callback(resource);
    }

    /**
     * Iterates through all the lights in the regions and returns each light.
     * @param callback Contains the light that is being iterated.
     */

    public forEachLight(callback: (light: Light) => void): void {
        for (let light of this.lights) callback(light);
    }

    /**
     * We iterate through the list of player instances. We correlate that
     * with each entity that we save in the region.
     */

    public forEachPlayer(callback: (player: Player) => void): void {
        for (let instance of this.players)
            if (instance in this.entities) callback(this.entities[instance] as Player);
    }

    /**
     * Iterates through all the entities joining the region.
     */

    public forEachJoining(callback: (entity: Entity) => void): void {
        for (let entity of this.joining) callback(entity);
    }
}
