import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class HotSauce implements Plugin {
    public onUse(player: Player): boolean {
        if (player.hotSauce) {
            player.notify(`I really shouldn't be drinking multiple of these...`);
            return false;
        }

        player.notify(`You feel an intense rush of adrenaline, you feel like you can run forever.`);

        // Update the hot sauce effect.
        player.setRunning(false, true);

        setTimeout(() => {
            player.setRunning(false, false);
            player.notify('The hot sauce effect has faded.');
        }, 15_000);

        return true;
    }
}
