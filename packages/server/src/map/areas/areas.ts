import _ from 'lodash';

import World from '../../game/world';
import log from '../../util/log';
import Area from './area';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default abstract class Areas {
    public data: ProcessedArea[];
    public world: World;
    public areas: Area[];

    constructor(data: ProcessedArea[], world: World) {
        this.data = data;
        this.world = world;

        this.areas = [];
    }

    public load(
        mapAreas: ProcessedArea[],
        callback?: (area: Area, mapArea: ProcessedArea) => void
    ): void {
        _.each(mapAreas, (a) => {
            let area: Area = new Area(a.id, a.x, a.y, a.width, a.height);

            if (a.polygon) area.polygon = a.polygon;

            this.areas.push(area);

            if (callback) callback(this.areas[this.areas.length - 1], a);
        });
    }

    public message(type: string): void {
        log.info(`Loaded ${this.areas.length} ${type} areas.`);
    }

    public inArea(x: number, y: number): Area | undefined {
        return _.find(this.areas, (area: Area) => {
            return area.contains(x, y);
        });
    }
}
