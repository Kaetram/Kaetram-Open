/* global module */

const _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class OverlayAreas {
    constructor() {
        const self = this;

        self.overlayAreas = [];

        self.load();
    }

    load() {
        const self = this,
            list = map.overlayAreas;

        _.each(list, o => {
            const overlayArea = new Area(o.id, o.x, o.y, o.width, o.height);

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
