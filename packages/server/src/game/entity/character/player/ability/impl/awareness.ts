import Player from '../../player';
import Ability from '../ability';

export default class Awareness extends Ability {
    public constructor(level: number, quickSlot = false) {
        super('awareness', level, quickSlot);
    }

    /**
     * Override for the superclass activate implementation. We update the player's movement
     * speed when the run ability is used.
     * @param player The player we are updating the movement speed for.
     */

    public override activate(player: Player): void {
        super.activate(player);
    }
}
