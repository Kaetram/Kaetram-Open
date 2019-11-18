/* global module */

const _ = require('underscore');
const Area = require('../area');
const map = require('../../../data/map/world_server');

class PVPAreas {
    constructor() {
        const self = this;

        self.pvpAreas = [];

        self.load();
    }

    load() {
        const self = this;
        const list = map.pvpAreas;

        _.each(list, p => {
            const pvpArea = new Area(p.id, p.x, p.y, p.width, p.height);

            self.pvpAreas.push(pvpArea);
        });

        log.info('Loaded ' + self.pvpAreas.length + ' PVP areas.');
    }
}

module.exports = PVPAreas;
