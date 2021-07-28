import { ProcessedArea } from '@kaetram/common/types/map';
import World from '../../../game/world';
import Area from '../area';
import Areas from '../areas';

export default class Achievements extends Areas {
    constructor(data: ProcessedArea[], world: World) {
        super(data, world);

        super.load(this.data, (area: Area, rawData) => {
            area.achievement = rawData.achievement!;
        });

        super.message('achievement');
    }
}
