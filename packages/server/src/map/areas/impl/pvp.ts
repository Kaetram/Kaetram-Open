import World from '../../../game/world';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default class PVP extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data);

        super.message('PVP');
    }
}
