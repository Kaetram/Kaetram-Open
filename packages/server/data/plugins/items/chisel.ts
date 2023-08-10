import { Modules } from '@kaetram/common/network';

import type { Plugin } from '.';
import type Player from '@kaetram/server/src/game/entity/character/player/player';

export default class Chisel implements Plugin {
    public onUse(player: Player): boolean {
        if (player.inCombat()) {
            player.notify(`You cannot activate the fletching menu while in combat.`);
            return false;
        }

        player.world.crafting.open(player, Modules.Skills.Chiseling);

        return true;
    }
}
