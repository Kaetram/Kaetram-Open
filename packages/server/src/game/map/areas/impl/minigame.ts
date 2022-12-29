import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../../world';
import type Area from '../area';

export default class Minigame extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            // Used to determine what minigame the object belongs to.
            area.minigame = rawData.minigame!;

            // Object type used within the minigame to organize the area.
            area.mObjectType = rawData.mObjectType!;
        });

        super.message('minigame');
    }
}
