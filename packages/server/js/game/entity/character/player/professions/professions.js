let _ = require('underscore'),
    Modules = require('../../../../../util/modules'),
    Formulas = require('../../../../../util/formulas');

class Professions {

    constructor(player) {
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
                let ProfessionClass = require(`./impl/${profession.toLowerCase()}`),
                    id = Modules.Professions[profession];

                this.professions[id] = new ProfessionClass(id, this.player);
            } catch(e) {
                log.debug(`Could not load ${profession} profession.`);
                log.error(e);
            }
        });

    }

    update(info) {
        _.each(info, (data, id) => {
            if (!(id in this.professions))
                return;

            this.professions[id].load(data);
        });
    }

    getProfession(id) {
        if (!(id in this.professions))
            return null;

        return this.professions[id];
    }

    stopAll() {
        this.forEachProfession((profession) => {
            profession.stop();
        });
    }

    forEachProfession(callback) {
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

        _.each(this.professions, (profession) => {
            data.push({
                id: profession.id,
                name: profession.name,
                level: profession.level,
                percentage: profession.getPercentage()
            });
        });

        return data;
    }

    getArray() {
        let data = {};

        _.each(this.professions, (profession) => {
            data[profession.id] = profession.getData();
        });

        return {
            username: this.player.username,
            data: data
        }
    }

}

module.exports = Professions;
