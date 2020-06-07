/* global module */

let TeamWar = require('../minigames/impl/teamwar');

class Minigames {

    constructor(world) {
        let self = this;

        self.world = world;

        self.minigames = {};

        self.load();
    }

    load() {
        let self = this;

        self.minigames['TeamWar'] = new TeamWar(self.world);

        log.info(`Finished loading ${Object.keys(self.minigames).length} minigames.`)
    }

    getTeamWar() {
        return this.minigames['TeamWar'];
    }
}

module.exports = Minigames;
