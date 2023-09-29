import Areas from '../areas';

import type Area from '../area';
import type World from '../../../world';
import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Music extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (musicArea: Area, rawData) => {
            musicArea.song = rawData.song!;
        });

        super.message('music');
    }
}
