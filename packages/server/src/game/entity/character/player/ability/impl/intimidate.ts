import Player from '../../player';
import Ability from '../ability';

import { Modules } from '@kaetram/common/network';

export default class Intimidate extends Ability {
    public constructor(level: number, quickSlot = false) {
        super('intimidate', level, quickSlot);
    }

    /**
     * Override for the superclass activate implementation. We update the player's movement
     * speed when the run ability is used.
     * @param player The player we are updating the movement speed for.
     */

    public override activate(player: Player): void {
        if (!player.hasTarget()) return player.notify(`You must be in combat to use this ability.`);

        super.activate(player);
    }
}
