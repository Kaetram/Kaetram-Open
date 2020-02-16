let Objects = require('../util/objects');

class GlobalObjects {

    constructor(world) {
        let self = this;

        self.world = world;

    }

    getObject(id) {
        return Objects.getObject(id);
    }

}

module.exports = GlobalObjects;
