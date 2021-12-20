import World from '../../../world';
import Area from '../area';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Dynamic extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            console.log(area);
            console.log(rawData);
        });

        super.message('dynamic');
    }
}
