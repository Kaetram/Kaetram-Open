import Area from '../area';
import Areas from '../areas';

import World from '../../../game/world';

export default class Achievements extends Areas {

    constructor(data: any, world?: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData: any) => {
            area.achievement = rawData.achievement;
        });

        super.message('achievement');
    }

}