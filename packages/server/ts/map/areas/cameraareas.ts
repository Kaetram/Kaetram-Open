/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class CameraAreas {

    constructor() {
        this.cameraAreas = [];

        this.load();
    }

    load() {
        let list = map.cameraAreas;

        _.each(list, (o) => {
            let cameraArea = new Area(o.id, o.x, o.y, o.width, o.height);

            cameraArea.type = o.type;

            this.cameraAreas.push(cameraArea);

        });

        log.info('Loaded ' + this.cameraAreas.length + ' camera areas.');
    }

}

export default CameraAreas;
