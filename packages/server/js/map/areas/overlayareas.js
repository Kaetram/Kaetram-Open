/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class OverlayAreas {

    constructor() {
        this.overlayAreas = [];

        this.load();
    }

    load() {
        let list = map.overlayAreas;

        _.each(list, (o) => {
            let overlayArea = new Area(o.id, o.x, o.y, o.width, o.height);

            overlayArea.darkness = o.darkness;
            overlayArea.type = o.type;

            if (o.fog)
                overlayArea.fog = o.fog;

            this.overlayAreas.push(overlayArea);
        });

        log.info('Loaded ' + this.overlayAreas.length + ' overlay areas.');
    }

}

module.exports = OverlayAreas;
