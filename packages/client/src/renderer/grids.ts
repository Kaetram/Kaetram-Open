import type Entity from '../entity/entity';
import type Map from '../map/map';

import log from '../lib/log';

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
}
