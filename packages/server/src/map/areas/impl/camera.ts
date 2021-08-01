import World from '../../../game/world';
import Area from '../area';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Camera extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            area.cameraType = rawData.type!;
        });

        super.message('camera');
    }
}
