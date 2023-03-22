import type Entity from '../entity/entity';

/**
 * Grids are used to keep track of the entities in the world and their positions. They are most used
 * when performing AOE attacks but may be used for some debugging purposes. We create a grid the size
 * of the map's width and height, and we store entity positions in there.
 */
export default class Grids {
    private entityGrid: { [instance: string]: Entity }[][] = [];

    public constructor(private width: number, private height: number) {
        /**
         * Create the two-dimensional grids.
         */

        for (let y = -1; y < this.height; y++) {
            this.entityGrid[y] = [];

            for (let x = -1; x < this.width; x++) this.entityGrid[y][x] = {};
        }
    }

    /**
     * Updates an entity's position in the grid. Removes its old location from the
     * grid and adds it to the new location.
     * @param entity The entity we are updating.
     */

    public updateEntity(entity: Entity) {
        if (entity.x === entity.oldX && entity.y === entity.oldY) return;

        this.removeFromEntityGrid(entity, entity.oldX, entity.oldY);
        this.addToEntityGrid(entity);
    }

    /**
     * Adds an entity to the entity grid. We use the entity's instance, x,
     * and y coordinates to store it in the grid.
     * @param entity The entity we are adding to the grid.
     */

    public addToEntityGrid(entity: Entity): void {
        this.entityGrid[entity.y][entity.x][entity.instance] = entity;
    }

    /**
     * Removes an entity from the entity grid.
     * @param entity The entity we are removing from the grid.
     * @param x The x coordinate of the entity or a specified coordinate.
     * @param y The y coordinate of the entity or a specified coordinate.
     */

    public removeFromEntityGrid(entity: Entity, x = entity.x, y = entity.y): void {
        delete this.entityGrid[y][x][entity.instance];
    }

    /**
     * Iterates through each entity at a specified coordinate and returns it.
     * @param x The grid x coordinate.
     * @param y The grid y coordinate.
     * @param callback The entity currently being iterated at the specified coordinate.
     */

    public forEachEntityAt(x: number, y: number, callback: (entity: Entity) => void): void {
        for (let instance in this.entityGrid[y][x]) callback(this.entityGrid[y][x][instance]);
    }

    /**
     * Looks through each nearby tile at a specified coordinate and creates a callback for each
     * entity that is found.
     * @param x The grid x coordinate.
     * @param y The grid y coordinate.
     * @param callback The entity currently being iterated at the specified coordinate.
     * @param radius How many tiles away from the specified coordinate we are looking.
     */

    public forEachEntityNear(
        x: number,
        y: number,
        callback: (entity: Entity) => void,
        radius = 1
    ): void {
        for (let i = x - radius; i <= x + radius; i++)
            for (let j = y - radius; j <= y + radius; j++)
                if (this.entityGrid[j]?.[i]) this.forEachEntityAt(i, j, callback);
    }
}
