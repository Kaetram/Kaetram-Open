/* global module */

import TeamWar from '../minigames/impl/teamwar';
import World from '../game/world';

class Minigames {

    public world: World;

    public minigames: any;

    constructor(world: World) {
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
