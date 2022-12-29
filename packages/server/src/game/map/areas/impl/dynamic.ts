import log from '@kaetram/common/util/log';
import _ from 'lodash-es';

import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../../world';
import type Area from '../area';

export default class Dynamic extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            area.mapping = rawData.mapping!;
            area.quest = rawData.quest!;
            area.achievement = rawData.achievement!;
        });

        this.link();

        log.info(`Loaded ${Math.ceil(this.areas.length / 2)} dynamic areas.`);
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
