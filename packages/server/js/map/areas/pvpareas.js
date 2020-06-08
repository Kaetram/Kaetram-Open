/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class PVPAreas {

    constructor() {
        this.pvpAreas = [];

        this.load();
    }

    load() {
        let list = map.pvpAreas;

        _.each(list, (p) => {
            let pvpArea = new Area(p.id, p.x, p.y, p.width, p.height);

            this.pvpAreas.push(pvpArea);
        });

        log.info('Loaded ' + this.pvpAreas.length + ' PVP areas.');
    }

}

module.exports = PVPAreas;
