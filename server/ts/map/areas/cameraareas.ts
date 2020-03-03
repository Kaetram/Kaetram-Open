/** @format */

import _ from 'underscore';
import Area from '../area';
import map from '../../../data/map/world_server.json';

class CameraAreas {
    public cameraAreas: any;

    constructor() {
        this.cameraAreas = [];

        this.load();
    }

    load() {
        const list = map.cameraAreas;

        _.each(list, o => {
            const cameraArea = new Area(o.id, o.x, o.y, o.width, o.height);

            cameraArea.type = o.type;

            this.cameraAreas.push(cameraArea);
        });

        console.info('Loaded ' + this.cameraAreas.length + ' camera areas.');
    }
}

export default CameraAreas;
