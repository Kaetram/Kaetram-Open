let _ = require('underscore'),
    Modules = require('../../../../../util/modules');

class Professions {

    constructor(player) {
        let self = this;

        self.player = player;

        self.professions = {};

        self.load();
    }

    load() {
        let self = this,
            pList = Object.keys(Modules.Professions); // professions enum list

        /**
        * We are accessing all the professions in the Modules.Professions
        * enum. We use the key to generate the profession class instance.
        */

        _.each(pList, (profession) => {
            try {
                let ProfessionClass = require(`./impl/${profession}`),
                    id = Modules.Professions[profession];

                self.professions[id] = new ProfessionClass(id);
            } catch(e) {
                log.debug(`Could not load ${profession} profession.`);
            }

        });
    }

    update(info) {
        let self = this;

        _.each(info, (data, id) => {
            if (!(id in self.professions))
                return;

            self.professions[id].load(data);
        });
    }

    getProfession(id) {
        let self = this;

        if (!(id in self.professions))
            return null;

        return self.professions[id];
    }

    getArray() {
        let self = this,
            data = {};

        _.each(self.professions, (profession) => {
            data[profession.id] = profession.getData();
        });

        return {
            username: self.player.username,
            data: data
        }
    }

}

module.exports = Professions;
