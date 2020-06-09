/* global module */

let _ = require('underscore');

class Grids {

    constructor(map) {
        this.map = map;

        this.entityGrid = [];

        this.load();
    }

    load() {
        for (let i = 0; i < this.map.height; i++) {
            this.entityGrid[i] = [];

            for (let j = 0; j < this.map.width; j++)
                this.entityGrid[i][j] = {};
        }
    }

    updateEntityPosition(entity) {
        if (entity && entity.oldX === entity.x && entity.oldY === entity.y)
            return;

        this.removeFromEntityGrid(entity, entity.oldX, entity.oldY);
        this.addToEntityGrid(entity, entity.x, entity.y);

        entity.updatePosition();
    }

    addToEntityGrid(entity, x, y) {
        if (entity && x > 0 && y > 0 && x < this.map.width && x < this.map.height && this.entityGrid[y][x])
            this.entityGrid[y][x][entity.instance] = entity;
    }

    removeFromEntityGrid(entity, x, y) {
        if (entity && x > 0 && y > 0 && x < this.map.width && y < this.map.height && this.entityGrid[y][x] && entity.instance in this.entityGrid[y][x])
            delete this.entityGrid[y][x][entity.instance];
    }

    getSurroundingEntities(entity, radius, include) {
        let entities = [];

        if (!this.checkBounds(entity.x, entity.y, radius))
            return;

        for (let i = -radius; i < radius + 1; i++) {

            for (let j = -radius; j < radius + 1; j++) {
                let pos = this.entityGrid[entity.y + i][entity.x + j];

                if (_.size(pos) > 0) {
                    _.each(pos,  (pEntity) => {

                        if (!include && pEntity.instance !== entity.instance)
                            entities.push(pEntity);
                    });
                }

            }
        }

        return entities;
    }

    checkBounds(x, y, radius) {
        return x + radius < this.map.width && x - radius > 0 && y + radius < this.map.height && y - radius > 0;
    }

}

export default Grids;
