import _ from 'underscore';
import Modules from '../../../../../util/modules';
import Player from '../player';
import World from '../../../../world';
import Profession from './impl/profession';
import professions from './impl';
import log from '../../../../../util/log';

class Professions {
    player: Player;
    world: World;

    professions: any;

    constructor(player: Player) {
        this.player = player;
        this.world = player.world;

        this.professions = {};

        this.load();
    }

    load() {
        let pList = Object.keys(Modules.Professions); // professions enum list

        /**
         * We are accessing all the professions in the Modules.Professions
         * enum. We use the key to generate the profession class instance.
         */

        _.each(pList, (profession) => {
            try {
                let ProfessionClass = professions[profession.toLowerCase()],
                    id = Modules.Professions[profession];

                this.professions[id] = new ProfessionClass(id, this.player);
            } catch (e) {
                log.debug(`Could not load ${profession} profession.`);
                log.error(e);
            }
        });
    }

    update(info: any) {
        _.each(info, (data, id) => {
            if (!(id in this.professions)) return;

            this.professions[id].load(data);
        });
    }

    getProfession(id: number) {
        if (!(id in this.professions)) return null;

        return this.professions[id];
    }

    stopAll() {
        this.forEachProfession((profession: Profession) => {
            profession.stop();
        });
    }

    forEachProfession(callback: Function) {
        _.each(this.professions, (profession) => {
            callback(profession);
        });
    }

    /**
     * This is the data we send to the client in order
     * to load the professions profile tab.
     */

    getInfo() {
        let data = [];

        _.each(this.professions, (profession: Profession) => {
            data.push({
                id: profession.id,
                name: profession.name,
                level: profession.level,
                percentage: profession.getPercentage(),
            });
        });

        return data;
    }

    getArray() {
        let data = {};

        _.each(this.professions, (profession: Profession) => {
            data[profession.id] = profession.getData();
        });

        return {
            username: this.player.username,
            data: data,
        };
    }
}

export default Professions;
