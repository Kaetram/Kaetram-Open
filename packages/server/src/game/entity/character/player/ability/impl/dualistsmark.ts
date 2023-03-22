import Ability from '../ability';

import type Player from '../../player';

export default class DualistsMark extends Ability {
    public constructor(level: number, quickSlot = -1) {
        super('dualistsmark', level, quickSlot);

        this.onDeactivate((player: Player) => player.setDualistsMark(false));
    }

    /**
     * Override for the superclass activate implementation. We update the player's movement
     * speed when the run ability is used.
     * @param player The player we are updating the movement speed for.
     */

    public override activate(player: Player): boolean {
        if (super.activate(player)) player.setDualistsMark(true);

        return false;
    }
}
