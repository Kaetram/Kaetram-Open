import Entity from '../entity/entity';
import Item from '../entity/objects/item';
import log from '../lib/log';
import Map from '../map/map';

export default class Grids {
    map: Map;
    renderingGrid: Record<string, Entity>[][];
    pathingGrid: number[][];
    itemGrid: Record<string, Item>[][];

    constructor(map: Map) {
        this.map = map;

        this.renderingGrid = [];
        this.pathingGrid = [];
        this.itemGrid = [];

        this.load();
    }

    load(): void {
        for (let i = 0; i < this.map.height; i++) {
            this.renderingGrid[i] = [];
            this.pathingGrid[i] = [];
            this.itemGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) {
                this.renderingGrid[i][j] = {};
                this.pathingGrid[i][j] = this.map.grid[i][j];
                this.itemGrid[i][j] = {};
            }
        }

        log.debug('Finished generating grids.');
    }

    resetPathingGrid(): void {
        this.pathingGrid = [];

        for (let i = 0; i < this.map.height; i++) {
            this.pathingGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) this.pathingGrid[i][j] = this.map.grid[i][j];
        }
    }

    addToRenderingGrid(entity: Entity, x: number, y: number): void {
        if (!this.map.isOutOfBounds(x, y)) this.renderingGrid[y][x][entity.id] = entity;
    }

    addToPathingGrid(x: number, y: number): void {
        this.pathingGrid[y][x] = 1;
    }

    addToItemGrid(item: Entity, x: number, y: number): void {
        if (item && this.itemGrid[y][x]) this.itemGrid[y][x][item.id] = item as Item;
    }

    removeFromRenderingGrid(entity: Entity, x: number, y: number): void {
        if (entity && this.renderingGrid[y][x] && entity.id in this.renderingGrid[y][x])
            delete this.renderingGrid[y][x][entity.id];
    }

    removeFromPathingGrid(x: number, y: number): void {
        this.pathingGrid[y][x] = 0;
    }

    removeFromMapGrid(x: number, y: number): void {
        this.map.grid[y][x] = 0;
    }

    removeFromItemGrid(item: Entity, x: number, y: number): void {
        if (item && this.itemGrid[y][x][item.id]) delete this.itemGrid[y][x][item.id];
    }

    removeEntity(entity: Entity): void {
        if (entity) {
            this.removeFromPathingGrid(entity.gridX, entity.gridY);
            this.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

            if (entity.nextGridX > -1 && entity.nextGridY > -1)
                this.removeFromPathingGrid(entity.nextGridX, entity.nextGridY);
        }
    }
}
