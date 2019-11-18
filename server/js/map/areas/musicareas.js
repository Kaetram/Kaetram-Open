/* global module */

const _ = require('underscore');
const Area = require('../area');
const map = require('../../../data/map/world_server');

class MusicAreas {
    constructor() {
        const self = this;

        self.musicAreas = [];

        self.load();
    }

    load() {
        const self = this;

        _.each(map.musicAreas, m => {
            const musicArea = new Area(m.id, m.x, m.y, m.width, m.height);

            self.musicAreas.push(musicArea);
        });

        log.info('Loaded ' + self.musicAreas.length + ' music areas.');
    }
}

module.exports = MusicAreas;
