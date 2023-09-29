import Areas from '../areas';

import type Area from '../area';
import type World from '../../../world';
import type { OverlayType, ProcessedArea } from '@kaetram/common/types/map';

export default class Overlay extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (overlayArea: Area, rawData: ProcessedArea) => {
            overlayArea.darkness = rawData.darkness!;
            overlayArea.type = (rawData.type! as OverlayType) || 'none';

            if (rawData.fog) overlayArea.fog = rawData.fog;
            if (rawData.rgb) overlayArea.rgb = rawData.rgb.split(',').map(Number);
        });

        super.message('overlay');
    }
}
