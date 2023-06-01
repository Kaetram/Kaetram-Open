import Areas from '../areas';

import type { OverlayType, ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../../world';
import type Area from '../area';

export default class Overlay extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (overlayArea: Area, rawData: ProcessedArea) => {
            overlayArea.darkness = rawData.darkness!;
            overlayArea.type = (rawData.type! as OverlayType) || 'none';
            overlayArea.playerLight = !!rawData.playerLight;

            if (rawData.fog) overlayArea.fog = rawData.fog;
        });

        super.message('overlay');
    }
}
