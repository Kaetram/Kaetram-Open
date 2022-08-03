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

        for (let y = 0; y < this.height; y++) {
            this.entityGrid[y] = [];

            for (let x = 0; x < this.width; x++) this.entityGrid[y][x] = {};
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
}
