/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class MusicAreas {

    constructor() {
        let self = this;

        self.musicAreas = [];

        self.load();
    }

    load() {
        let self = this;

        _.each(map.musicAreas, (m) => {
            let musicArea = new Area(m.id, m.x, m.y, m.width, m.height);

            self.musicAreas.push(musicArea);
        });

        log.info('Loaded ' + self.musicAreas.length + ' music areas.');
    }

}

module.exports = MusicAreas;