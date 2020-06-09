/* global module */

import _ from 'underscore';
import Area from '../area';
import log from "../../util/log";
import * as map from '../../../data/map/world_server.json';

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
