import type { Plugin } from '.';
import type Player from '@kaetram/server/src/game/entity/character/player/player';

export default class BlackPotion implements Plugin {
    public onUse(player: Player): boolean {
        player.notify(`You drink the black potion and start feeling unwell.`);

        setTimeout(() => player.hit(player.hitPoints.getHitPoints() - 1), 5000);

        return true;
    }
}
