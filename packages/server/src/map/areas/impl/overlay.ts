import { ProcessedArea } from '@kaetram/tools/map/mapdata';
import World from '../../../game/world';
import Area from '../area';
import Areas from '../areas';

export default class Overlay extends Areas {
    constructor(data: ProcessedArea[], world?: World) {
        super(data, world);

        super.load(this.data, (overlayArea: Area, rawData) => {
            overlayArea.darkness = rawData.darkness;
            overlayArea.type = rawData.type;

            if (rawData.fog) overlayArea.fog = rawData.fog;
        });

        super.message('camera');
    }
}
