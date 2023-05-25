import type { Plugin } from '.';
import type Player from '@kaetram/server/src/game/entity/character/player/player';

export default class SnowPotion implements Plugin {
    public onUse(player: Player): boolean {
        player.setSnowPotion();

        return true;
    }
}
