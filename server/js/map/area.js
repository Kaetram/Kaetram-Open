/* global module */

class Area {

    constructor(id, x, y, width, height) {
        let self = this;

        self.id = id;

        self.x = x;
        self.y = y;

        self.width = width;
        self.height = height;

        self.entities = [];
        self.items = [];

        self.hasRespawned = true;
        self.chest = null;

        self.maxEntities = 0;
    }

    contains(x, y) {
        return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
    }

    addEntity(entity) {
        let self = this;

        if (self.entities.indexOf(entity) > 0)
            return;

        self.entities.push(entity);
        entity.area = self;

        if (self.spawnCallback)
            self.spawnCallback();
    }

    removeEntity(entity) {
        let self = this,
            index = self.entities.indexOf(entity);

        if (index > -1)
            self.entities.splice(index, 1);

        if (self.entities.length === 0 && self.emptyCallback)
            self.emptyCallback();
    }

    setMaxEntities(maxEntities) {
        this.maxEntities = maxEntities;
    }

    onEmpty(callback) {
        this.emptyCallback = callback;
    }

    onSpawn(callback) {
        this.spawnCallback = callback;
    }

}

module.exports = Area;