import _ from 'lodash';

import World from '../../../world';
import Area from '../area';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';
import log from '@kaetram/common/util/log';

export default class Dynamic extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            area.mapping = rawData.mapping!;
            area.quest = rawData.quest!;
            area.achievement = rawData.achievement!;
        });

        this.link();

        log.info(`Loaded ${this.areas.length / 2} dynamic areas.`);
    }

    /**
     * Links all the dynamic regions to their mapping counterparts.
     */

    private link(): void {
        _.each(this.areas, (area: Area) => {
            if (!area.mapping) return;

            area.mappedArea = this.get(area.mapping);
        });
    }
}
