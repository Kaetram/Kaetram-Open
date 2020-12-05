import _ from 'lodash';
import Area from '../area';
import map from '../../../data/map/world_server.json';
import log from '../../util/log';

class AchievementAreas {
    achievementAreas: any;

    constructor() {
        this.achievementAreas = [];

        this.load();
    }

    load() {
        let list = map.achievementAreas;

        _.each(list, (o: any) => {
            let achievementArea: any = new Area(o.id, o.x, o.y, o.width, o.height);

            achievementArea.achievement = parseInt(o.achievement);

            this.achievementAreas.push(achievementArea);
        });

        log.info(`Loaded ${this.achievementAreas.length} achievement areas.`);
    }
}

export default AchievementAreas;
