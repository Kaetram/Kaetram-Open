import * as _ from 'underscore';
import Area from '../area';
import map from '../../../data/map/world_server.json';

/**
 *
 */
class MusicAreas {
    public musicAreas: any;

    constructor() {
        this.musicAreas = [];

        this.load();
    }

    load() {
        _.each(map.musicAreas, (m) => {
            const musicArea = new Area(m.id, m.x, m.y, m.width, m.height);

            this.musicAreas.push(musicArea);
        });

        console.info(`Loaded ${this.musicAreas.length} music areas.`);
    }
}

export default MusicAreas;
