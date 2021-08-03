import log from '@kaetram/common/util/log';

import TeamWar from '../minigames/impl/teamwar';

import type World from '../game/world';
import type Minigame from '../minigames/minigame';

export default class Minigames {
    public minigames: { [game: string]: Minigame } = {};

    public constructor(private world: World) {
        this.load();
    }

    private load(): void {
        this.minigames.TeamWar = new TeamWar(this.world);

        log.info(`Finished loading ${Object.keys(this.minigames).length} minigames.`);
    }

    public getTeamWar(): Minigame {
        return this.minigames.TeamWar;
    }
}
