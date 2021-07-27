import { ProcessedArea } from '@kaetram/tools/map/mapdata';
import World from '../../../game/world';
import Areas from '../areas';

export default class PVP extends Areas {
    constructor(data: ProcessedArea[], world?: World) {
        super(data, world);

        super.load(this.data);

        super.message('PVP');
    }
}
