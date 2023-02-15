import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class SnowPotion implements Plugin {
    public onUse(player: Player): boolean {
        player.setSnowPotionEffect();

        return true;
    }
}
