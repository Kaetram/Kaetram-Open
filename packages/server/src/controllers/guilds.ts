import type World from '../game/world';
import type Player from '../game/entity/character/player/player';

export default class Guilds {
    public constructor(private world: World) {}

    public create(_player: Player, _name: string): void {
        //
    }
}
