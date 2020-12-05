/* global module */

import _ from 'lodash';
import Area from '../area';
import map from '../../../data/map/world.json';
import log from '../../util/log';

class CameraAreas {
    cameraAreas: any;

    constructor() {
        this.cameraAreas = [];

        this.load();
    }

    load() {
        let list = map.cameraAreas;

        _.each(list, (o) => {
            let cameraArea: any = new Area(o.id, o.x, o.y, o.width, o.height);

            cameraArea.type = o.type;

            this.cameraAreas.push(cameraArea);
        });

        log.info('Loaded ' + this.cameraAreas.length + ' camera areas.');
    }
}

export default CameraAreas;
