import log from '../lib/log';

import type Entity from '../entity/entity';
import type Map from '../map/map';

export default class Grids {
    // Grid used for rendering entities.
    public renderingGrid: { [id: string]: Entity }[][] = [];

    public constructor(private map: Map) {
        this.load();
    }

    /**
     * Loads a rendering grid based on the proportions of the map's
     * width and height. The rendering grid saves the entities near
     * the players. We use this grid in order to render them.
     */

    private load(): void {
        for (let i = 0; i < this.map.height; i++) {
            this.renderingGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) this.renderingGrid[i][j] = {};
        }

        log.debug('Finished generating the rendering grid.');
    }

    /**
     * Adds an entity to the rendering grid.
     * @param entity The entity we are adding to the rendering grid.
     */

    public addToRenderingGrid(entity: Entity): void {
        let { instance, gridX: x, gridY: y } = entity;

        // Ensure the position is valid.
        if (!this.map.isOutOfBounds(x, y)) this.renderingGrid[y][x][instance] = entity;
    }

    /**
     * Removes an entity from the rendering grid.
     * @param entity The entity parameter we are extracting instance, gridX, and gridY from.
     */

    public removeFromRenderingGrid({ instance, gridX, gridY }: Entity): void {
        delete this.renderingGrid[gridY][gridX][instance];
    }

    /**
     * Looks about a grid coordinate for entities and returns them.
     * @param gridX The x grid coordinate we are looking around.
     * @param gridY The y grid coordinate we are looking around.
     * @param radius How many tiles we are looking around.
     */

    public getEntitiesAround(gridX: number, gridY: number, radius = 2): Entity[] {
        let entities: Entity[] = [];

        for (let i = gridY - radius; i < gridY + radius; i++)
            for (let j = gridX - radius; j < gridX + radius; j++)
                if (this.map.isOutOfBounds(j, i)) continue;
                else entities = [...entities, ...Object.values(this.renderingGrid[i][j])];

        return entities;
    }
}
