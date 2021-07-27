import TeamWar from '../minigames/impl/teamwar';
import log from '../util/log';

import type World from '../game/world';
import type Minigame from '../minigames/minigame';

export default class Minigames {
    public world: World;

    public minigames: { [game: string]: Minigame };

    constructor(world: World) {
        this.world = world;

        this.minigames = {};

        this.load();
    }

    load(): void {
        this.minigames.TeamWar = new TeamWar(this.world);

        log.info(`Finished loading ${Object.keys(this.minigames).length} minigames.`);
    }

    getTeamWar(): Minigame {
        return this.minigames.TeamWar;
    }
}
