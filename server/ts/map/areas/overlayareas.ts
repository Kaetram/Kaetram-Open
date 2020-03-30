import * as _ from 'underscore';
import Area from '../area';
import map from '../../../data/map/world_server.json';

/**
 *
 */
class OverlayAreas {
    public overlayAreas: any;

    constructor() {
        this.overlayAreas = [];

        this.load();
    }

    load() {
        const list = map.overlayAreas;

        _.each(list, (o) => {
            const overlayArea = new Area(o.id, o.x, o.y, o.width, o.height);

            overlayArea.darkness = o.darkness;
            overlayArea.type = o.type;

            if (o.fog) overlayArea.fog = o.fog;

            this.overlayAreas.push(overlayArea);
        });

        console.info(`Loaded ${this.overlayAreas.length} overlay areas.`);
    }
}

export default OverlayAreas;
