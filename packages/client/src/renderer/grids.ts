import type Entity from '../entity/entity';
import type Item from '../entity/objects/item';
import type Map from '../map/map';

import log from '../lib/log';

export default class Grids {
    public renderingGrid: { [id: string]: Entity }[][] = [];
    public itemGrid: { [id: string]: Item }[][] = [];

    public constructor(private map: Map) {
        this.load();
    }

    private load(): void {
        let { map, renderingGrid, itemGrid } = this,
            { height, width, grid } = map;

        for (let i = 0; i < height; i++) {
            renderingGrid[i] = [];
            itemGrid[i] = [];

            for (let j = 0; j < width; j++) {
                renderingGrid[i][j] = {};
                itemGrid[i][j] = {};
            }
        }

        log.debug('Finished generating grids.');
    }

    public addToRenderingGrid(entity: Entity): void {
        let { instance, gridX: x, gridY: y } = entity;

        if (!this.map.isOutOfBounds(x, y)) this.renderingGrid[y][x][instance] = entity;
    }

    public addToItemGrid(item: Item): void {
        let { instance, gridX: x, gridY: y } = item;

        if (item && this.itemGrid[y][x]) this.itemGrid[y][x][instance] = item;
    }

    public removeFromRenderingGrid({ instance, gridX, gridY }: Entity): void {
        delete this.renderingGrid[gridY][gridX][instance];
    }

    // removeFromMapGrid(x: number, y: number): void {
    //     this.map.grid[y][x] = 0;
    // }

    public removeFromItemGrid({ instance, gridX, gridY }: Entity): void {
        delete this.itemGrid[gridY][gridX][instance];
    }

    public removeEntity(entity: Entity): void {
        if (entity) this.removeFromRenderingGrid(entity);
    }
}
