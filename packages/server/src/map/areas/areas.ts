import _ from 'lodash';

import log from '@kaetram/common/util/log';

import Area from './area';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../game/world';

export default abstract class Areas {
    public areas: Area[] = [];

    protected constructor(public data: ProcessedArea[], public world: World) {}

    public load(
        mapAreas: ProcessedArea[],
        callback?: (area: Area, mapArea: ProcessedArea) => void
    ): void {
        _.each(mapAreas, (a) => {
            let area: Area = new Area(a.id, a.x, a.y, a.width, a.height);

            if (a.polygon) area.polygon = a.polygon;

            this.areas.push(area);

            callback?.(this.areas[this.areas.length - 1], a);
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
