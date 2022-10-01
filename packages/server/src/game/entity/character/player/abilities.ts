import _ from 'lodash';

import Player from './player';
import Ability from './ability/ability';

import { SerializedAbilities, SerializedAbility } from '@kaetram/common/types/ability';

export default class Abilities {
    private abilities: Ability[] = []; // All the abilities that the player has.
    private quickSlots: Ability[] = []; //

    public constructor(private player: Player) {}

    public load(info: SerializedAbilities): void {
        //
    }

    /**
     * Iterates through the player's abilities and serializes the ability information.
     * @returns A SerializedAbilities object containing the player's abilities and quick slots.
     */

    public serialize(): SerializedAbilities {
        let abilities: SerializedAbility[] = [],
            quickSlots: string[] = [];

        _.each(this.abilities, (ability: Ability) => abilities.push(ability.serialize()));
        _.each(this.quickSlots, (ability: Ability) => quickSlots.push(ability.key));

        return {
            abilities,
            quickSlots
        };
    }
}
