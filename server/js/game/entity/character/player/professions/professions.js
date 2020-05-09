let _ = require('underscore'),
    Modules = require('../../../../../util/modules'),
    Messages = require('../../../../../network/messages'),
    Packets = require('../../../../../network/packets');

class Professions {

    constructor(player) {
        let self = this;

        self.player = player;
        self.world = player.world;

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
                let ProfessionClass = require(`./impl/${profession.toLowerCase()}`),
                    id = Modules.Professions[profession];

                self.professions[id] = new ProfessionClass(id, self.player);
            } catch(e) {
                log.debug(`Could not load ${profession} profession.`);
                log.error(e);
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

    stopAll() {
        var self = this;

        self.forEachProfession((profession) => {
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
        let self = this,
            data = [];

        _.each(self.professions, (profession) => {
            data.push({
                id: profession.id,
                name: profession.name,
                level: profession.level
            });
        });

        return data;
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
