import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';

export default class Camera extends Areas {
    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData: any) => {
            area.cameraType = rawData.type;
        });

        super.message('camera');
    }
}
