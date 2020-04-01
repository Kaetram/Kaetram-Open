import _ from 'underscore';

export default class Grids {
    map: any;
    renderingGrid: any[];
    pathingGrid: any[];
    entityGrid: any[];
    itemGrid: any[];

    constructor(map) {
        this.map = map;

        this.renderingGrid = [];
        this.pathingGrid = [];
        this.entityGrid = [];
        this.itemGrid = [];

        this.load();
    }

    load() {
        for (let i = 0; i < this.map.height; i++) {
            this.renderingGrid[i] = [];
            this.pathingGrid[i] = [];
            this.entityGrid[i] = [];
            this.itemGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) {
                this.renderingGrid[i][j] = {};
                this.pathingGrid[i][j] = this.map.grid[i][j];
                this.entityGrid[i][j] = {};
                this.itemGrid[i][j] = {};
            }
        }

        if (this.map.game.isDebug()) console.info('Finished generating grids.');
    }

    checkPathingGrid(player, xRadius, yRadius) {
        for (let y = player.gridY - yRadius; y < player.gridY + yRadius; y++) {
            for (
                let x = player.gridX - xRadius;
                x < player.gridX + xRadius;
                x++
            ) {
                if (
                    !this.map.isColliding(x, y) &&
                    _.size(this.entityGrid[y][x] === 0)
                ) {
                    this.removeFromPathingGrid(x, y);
                }
            }
        }
    }

    resetPathingGrid() {
        this.pathingGrid = [];

        for (let i = 0; i < this.map.height; i++) {
            this.pathingGrid[i] = [];

            for (let j = 0; j < this.map.width; j++) {
                this.pathingGrid[i][j] = this.map.grid[i][j];
            }
        }
    }

    addToRenderingGrid(entity, x, y) {
        if (!this.map.isOutOfBounds(x, y)) {
            this.renderingGrid[y][x][entity.id] = entity;
        }
    }

    addToPathingGrid(x, y) {
        this.pathingGrid[y][x] = 1;
    }

    addToEntityGrid(entity, x, y) {
        if (entity && this.entityGrid[y][x]) {
            this.entityGrid[y][x][entity.id] = entity;
        }
    }

    addToItemGrid(item, x, y) {
        if (item && this.itemGrid[y][x]) this.itemGrid[y][x][item.id] = item;
    }

    removeFromRenderingGrid(entity, x, y) {
        if (
            entity &&
            this.renderingGrid[y][x] &&
            entity.id in this.renderingGrid[y][x]
        ) {
            delete this.renderingGrid[y][x][entity.id];
        }
    }

    removeFromPathingGrid(x, y) {
        this.pathingGrid[y][x] = 0;
    }

    removeFromMapGrid(x, y) {
        this.map.grid[y][x] = 0;
    }

    removeFromEntityGrid(entity, x, y) {
        if (
            entity &&
            this.entityGrid[y][x] &&
            entity.id in this.entityGrid[y][x]
        ) {
            delete this.entityGrid[y][x][entity.id];
        }
    }

    removeFromItemGrid(item, x, y) {
        if (item && this.itemGrid[y][x][item.id]) {
            delete this.itemGrid[y][x][item.id];
        }
    }

    removeEntity(entity) {
        if (entity) {
            this.removeFromEntityGrid(entity, entity.gridX, entity.gridY);
            this.removeFromPathingGrid(entity.gridX, entity.gridY);
            this.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);

            if (entity.nextGridX > -1 && entity.nextGridY > -1) {
                this.removeFromEntityGrid(
                    entity,
                    entity.nextGridX,
                    entity.nextGridY
                );
                this.removeFromPathingGrid(entity.nextGridX, entity.nextGridY);
            }
        }
    }
}
