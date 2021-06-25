import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';

export default class PVP extends Areas {
    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data);

        super.message('PVP');
    }
}
