import { ProcessedArea } from '@kaetram/common/types/map';
import World from '../../../game/world';
import Areas from '../areas';

export default class PVP extends Areas {
    constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data);

        super.message('PVP');
    }
}
