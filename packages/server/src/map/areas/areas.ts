import _ from 'lodash';
import Area from './area';
import World from '../../game/world';
import log from '../../util/log';

export default class Areas {

    public data: any;
    public world: World;
    public areas: Area[];

    constructor(data: any, world?: World) {
        this.data = data;
        this.world = world;

        this.areas = [];
    }

    public load(mapAreas: any, callback?: Function) {
        _.each(mapAreas, (a: any) => {
            let area: Area = new Area(a.id, a.x, a.y, a.width, a.height);

            this.areas.push(area);

            if (callback) callback(this.areas[this.areas.length - 1], a);
        });
    }

    public message(type: string) {
        log.info(`Loaded ${this.areas.length} ${type} areas.`);
    }
    
    public inArea(x: number, y: number): Area {
        return _.find(this.areas, (area: Area) => {
            return area.contains(x, y);
        });
    }
}