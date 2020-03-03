/** @format */

import _ from 'underscore';
import Area from '../area';
import map from '../../../data/map/world_server.json';

class PVPAreas {
    public pvpAreas: any;

    constructor() {
        this.pvpAreas = [];

        this.load();
    }

    load() {
        const list = map.pvpAreas;

        _.each(list, p => {
            const pvpArea = new Area(p.id, p.x, p.y, p.width, p.height);

            this.pvpAreas.push(pvpArea);
        });

        console.info('Loaded ' + this.pvpAreas.length + ' PVP areas.');
    }
}

export default PVPAreas;
