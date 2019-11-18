/* global module */

const _ = require('underscore');
const Area = require('../area');
const map = require('../../../data/map/world_server');

class CameraAreas {
    constructor() {
        const self = this;

        self.cameraAreas = [];

        self.load();
    }

    load() {
        const self = this;
        const list = map.cameraAreas;

        _.each(list, o => {
            const cameraArea = new Area(o.id, o.x, o.y, o.width, o.height);

            cameraArea.type = o.type;

            self.cameraAreas.push(cameraArea);
        });

        log.info('Loaded ' + self.cameraAreas.length + ' camera areas.');
    }
}

module.exports = CameraAreas;
