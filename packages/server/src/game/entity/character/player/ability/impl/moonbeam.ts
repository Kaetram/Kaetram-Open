import Ability from '../ability';

import type Player from '../../player';

export default class Moonbeam extends Ability {
    public constructor(level: number, quickSlot = -1) {
        super('moonbeam', level, quickSlot);
    }

    /**
     * Implement Moonbeam's specific behavior here.
     * @param player The player using the Moonbeam ability.
     */
    public override activate(player: Player): boolean {
        if (!player.hasTarget()) {
            player.notify(`misc:NEED_COMBAT`);
            return false;
        }

        return super.activate(player);
    }
}
