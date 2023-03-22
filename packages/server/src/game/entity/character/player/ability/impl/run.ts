import Ability from '../ability';

import type Player from '../../player';

export default class Run extends Ability {
    public constructor(level: number, quickSlot = -1) {
        super('run', level, quickSlot);

        // Revert the player's speed back to normal when ability is deactivated.
        this.onDeactivate((player: Player) => player.setRunning(false));
    }

    /**
     * Override for the superclass activate implementation. We update the player's movement
     * speed when the run ability is used.
     * @param player The player we are updating the movement speed for.
     */

    public override activate(player: Player): boolean {
        if (super.activate(player)) player.setRunning(true);

        return false;
    }
}
