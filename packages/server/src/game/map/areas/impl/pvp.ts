import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type World from '../../../world';

export default class PVP extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data);

        super.message('PVP');
    }
}
