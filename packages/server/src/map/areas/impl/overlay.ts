import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';

export default class Overlay extends Areas {

    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data, (overlayArea: Area, rawData: any) => {
            overlayArea.darkness = rawData.darkness;
            overlayArea.type = rawData.type;

            if (rawData.fog) overlayArea.fog = rawData.fog;
        });

        super.message('camera');
    }

}