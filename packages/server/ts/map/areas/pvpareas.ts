/* global module */

import _ from 'underscore';
import Area from '../area';
import * as map from '../../../data/map/world_server.json';

class PVPAreas {

    pvpAreas: any;

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

export default PVPAreas;
