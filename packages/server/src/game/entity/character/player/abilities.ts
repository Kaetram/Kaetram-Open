import _ from 'lodash';

import Player from './player';
import Ability from './ability/ability';
import AbilitiesIndex from './ability/impl/index';

import log from '@kaetram/common/util/log';

import { SerializedAbilities, SerializedAbility } from '@kaetram/common/types/ability';

export default class Abilities {
    private abilities: Ability[] = []; // All the abilities that the player has.
    private quickSlots: Ability[] = []; //

    private loadCallback?: () => void;

    public constructor(private player: Player) {}

    /**
     * Loads the abilities from the database. The serialized abilities are loaded
     * into the `abilities` array, and the quickslots are selected based on the
     * existing abilities.
     * @param info Contains the abilities and quick slot information.
     */

    public load(info: SerializedAbilities): void {
        let { quickSlots, abilities } = info;

        /**
         * We go through each of the abilities in the database and add it to our ability list.
         * For each ability created, we check by removing the first element of the quick slots
         * array and if it matches the ability's key, we add it to the quick slots.
         */

        _.each(abilities, (ability: SerializedAbility) =>
            this.add(ability.key, ability.level, quickSlots.shift() === ability.key)
        );

        this.loadCallback?.();
    }

    /**
     * Uses the ability key to find the ability subclass and creates an object
     * based on that. The level is passed to the subclass constructor.
     * @param key The key of the ability we are creating.
     * @param level The level of the ability.
     * @param toQuickSlot Whether or not the ability should be added to the quick slots.
     */

    private add(key: string, level: number, toQuickSlot = false): void {
        // Create ability based on the key from index of ability classes.
        let ability = new AbilitiesIndex[key as keyof typeof AbilitiesIndex](level);

        // Ensure the ability has valid data.
        if (!ability.isValid())
            return log.warning(`[${this.player.username}] Invalid ability: ${key}`);

        this.abilities.push(ability);

        // Add the ability to the quick slots if the parameter is true.
        if (toQuickSlot) this.quickSlots.push(ability);
    }

    /**
     * Iterates through the player's abilities and serializes the ability information.
     * @param includeType Whether or not to include the type of the ability.
     * @returns A SerializedAbilities object containing the player's abilities and quick slots.
     */

    public serialize(includeType = false): SerializedAbilities {
        let abilities: SerializedAbility[] = [],
            quickSlots: string[] = [];

        _.each(this.abilities, (ability: Ability) =>
            abilities.push(ability.serialize(includeType))
        );
        _.each(this.quickSlots, (ability: Ability) => quickSlots.push(ability.key));

        return {
            abilities,
            quickSlots
        };
    }

    /**
     * Callback for when the abilities have loaded from the database.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }
}
