/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class OverlayAreas {

    constructor() {
        let self = this;

        self.overlayAreas = [];

        self.load();
    }

    load() {
        let self = this,
            list = map.overlayAreas;

        _.each(list, (o) => {
            let overlayArea = new Area(o.id, o.x, o.y, o.width, o.height);

            overlayArea.darkness = o.darkness;
            overlayArea.type = o.type;

            if (o.fog)
                overlayArea.fog = o.fog;

            self.overlayAreas.push(overlayArea);
        });

        log.info('Loaded ' + self.overlayAreas.length + ' overlay areas.');
    }

}

module.exports = OverlayAreas;