import type Entity from '../entity/entity';
import type Item from '../entity/objects/item';
import type Map from '../map/map';

import log from '../lib/log';

export default class Grids {
    public renderingGrid: { [id: string]: Entity }[][] = [];
    public pathingGrid: number[][] = [];
    public itemGrid: { [id: string]: Item }[][] = [];

    public constructor(private map: Map) {
        this.load();
    }

    private load(): void {
        let { map, renderingGrid, pathingGrid, itemGrid } = this,
            { height, width, grid } = map;

        for (let i = 0; i < height; i++) {
            renderingGrid[i] = [];
            pathingGrid[i] = [];
            itemGrid[i] = [];

            for (let j = 0; j < width; j++) {
                renderingGrid[i][j] = {};
                pathingGrid[i][j] = grid[i][j];
                itemGrid[i][j] = {};
            }
        }

        log.debug('Finished generating grids.');
    }

    public resetPathingGrid(): void {
        this.pathingGrid = [];

        let { pathingGrid, map } = this;

        for (let i = 0; i < map.height; i++) {
            pathingGrid[i] = [];

            for (let j = 0; j < map.width; j++) pathingGrid[i][j] = map.grid[i][j];
        }
    }

    public addToRenderingGrid(entity: Entity): void {
        let { id, gridX: x, gridY: y } = entity;

        if (!this.map.isOutOfBounds(x, y)) this.renderingGrid[y][x][id] = entity;
    }

    public addToPathingGrid(x: number, y: number): void {
        this.pathingGrid[y][x] = 1;
    }

    public addToItemGrid(item: Item): void {
        let { id, gridX: x, gridY: y } = item;

        if (item && this.itemGrid[y][x]) this.itemGrid[y][x][id] = item;
    }

    public removeFromRenderingGrid({ id, gridX, gridY }: Entity): void {
        delete this.renderingGrid[gridY][gridX][id];
    }

    public removeFromPathingGrid(x: number, y: number): void {
        this.pathingGrid[y][x] = 0;
    }

    // removeFromMapGrid(x: number, y: number): void {
    //     this.map.grid[y][x] = 0;
    // }

    public removeFromItemGrid({ id, gridX, gridY }: Entity): void {
        delete this.itemGrid[gridY][gridX][id];
    }

    public removeEntity(entity: Entity): void {
        if (entity) {
            let { gridX, gridY, nextGridX, nextGridY } = entity;

            this.removeFromPathingGrid(gridX, gridY);
            this.removeFromRenderingGrid(entity);

            if (nextGridX > -1 && nextGridY > -1) this.removeFromPathingGrid(nextGridX, nextGridY);
        }
    }
}
