import Player from '../../player';
import Ability from '../ability';

import { Modules } from '@kaetram/common/network';

export default class Run extends Ability {
    public constructor(level: number, quickSlot = false) {
        super('run', level, quickSlot);

        // Revert the player's speed back to normal when ability is deactivated.
        this.onDeactivate((player: Player) =>
            player.setMovementSpeed(Modules.Defaults.MOVEMENT_SPEED)
        );
    }

    /**
     * Override for the superclass activate implementation. We update the player's movement
     * speed when the run ability is used.
     * @param player The player we are updating the movement speed for.
     */

    public override activate(player: Player): void {
        super.activate(player);

        player.setMovementSpeed(225);
    }
}
