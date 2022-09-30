import Player from './player';
import Ability from './ability/ability';

export default class Abilities {
    private abilities: Ability[] = []; // All the abilities that the player has.
    private quickSlots: Ability[] = []; //

    public constructor(private player: Player) {}
}
