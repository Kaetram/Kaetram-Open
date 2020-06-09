/* global module */

let TeamWar = require('../minigames/impl/teamwar');

class Minigames {

    constructor(world) {
        this.world = world;

        this.minigames = {};

        this.load();
    }

    load() {
        this.minigames['TeamWar'] = new TeamWar(this.world);

        log.info(`Finished loading ${Object.keys(this.minigames).length} minigames.`)
    }

    getTeamWar() {
        return this.minigames['TeamWar'];
    }
}

export default Minigames;
