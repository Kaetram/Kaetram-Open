/* global module */

let _ = require('underscore'),
    Area = require('../area'),
    map = require('../../../data/map/world_server');

class MusicAreas {

    constructor() {
        this.musicAreas = [];

        this.load();
    }

    load() {
        _.each(map.musicAreas, (m) => {
            let musicArea = new Area(m.id, m.x, m.y, m.width, m.height);

            this.musicAreas.push(musicArea);
        });

        log.info('Loaded ' + this.musicAreas.length + ' music areas.');
    }

}

export default MusicAreas;
