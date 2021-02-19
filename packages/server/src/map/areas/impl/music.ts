import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';

export default class Music extends Areas {

    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data, (musicArea: Area, rawData: any) => {
            musicArea.song = rawData.songName;
        });

        super.message('music');
    }

}
