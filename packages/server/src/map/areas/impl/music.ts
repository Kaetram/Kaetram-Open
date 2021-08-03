import World from '../../../game/world';
import Area from '../area';
import Areas from '../areas';

import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Music extends Areas {
    public constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (musicArea: Area, rawData) => {
            musicArea.song = rawData.songName!;
        });

        super.message('music');
    }
}
