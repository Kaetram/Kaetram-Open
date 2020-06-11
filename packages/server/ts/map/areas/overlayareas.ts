/* global module */

import _ from 'underscore';
import Area from '../area';
import * as map from '../../../data/map/world_server.json';
import log from '../../util/log';

class OverlayAreas {
    overlayAreas: any;

    constructor() {
        this.overlayAreas = [];

        this.load();
    }

    load() {
        let list = map.overlayAreas;

        _.each(list, (o: any) => {
            let overlayArea: any = new Area(o.id, o.x, o.y, o.width, o.height);

            overlayArea.darkness = o.darkness;
            overlayArea.type = o.type;

            if (o.fog) overlayArea.fog = o.fog;

            this.overlayAreas.push(overlayArea);
        });

        log.info('Loaded ' + this.overlayAreas.length + ' overlay areas.');
    }
}

export default OverlayAreas;
