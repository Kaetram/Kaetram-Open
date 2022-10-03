import _ from 'lodash';

import Player from './player';
import Ability from './ability/ability';
import AbilitiesIndex from './ability/impl/index';

import log from '@kaetram/common/util/log';

import { Ability as AbilityPacket } from '../../../../network/packets';

import { SerializedAbility, AbilityData } from '@kaetram/common/types/ability';
import { Opcodes } from '@kaetram/common/network';

type AddCallback = (ability: Ability) => void;

export default class Abilities {
    private abilities: { [key: string]: Ability } = {}; // All the abilities that the player has.

    private loadCallback?: () => void;
    private addCallback?: AddCallback;

    public constructor(private player: Player) {}

    /**
     * Loads the abilities from the database. The serialized abilities are loaded
     * into the `abilities` array.
     * @param info Contains the abilities and quick slot information.
     */

    public load(info: SerializedAbility): void {
        _.each(info.abilities, (ability: AbilityData) =>
            this.add(ability.key, ability.level, ability.quickSlot, true)
        );

        this.loadCallback?.();
    }

    /**
     * Sends a packet to the player when an ability undergoes a change in level.
     * @param key The key of the ability that has changed.
     * @param level The new level of the ability.
     */

    private handleLevel(key: string, level: number): void {
        this.player.send(
            new AbilityPacket(Opcodes.Ability.Level, {
                key,
                level
            })
        );
    }

    /**
     * Uses the ability key to find the ability subclass and creates an object
     * based on that. The level is passed to the subclass constructor.
     * @param key The key of the ability we are creating.
     * @param level The level of the ability.
     * @param quickSlot Whether or not the ability is in the quick slots.
     * @param skipAddCallback Whether or not to skip the add callback.
     */

    public add(key: string, level: number, quickSlot = false, skipAddCallback = false): void {
        // Create ability based on the key from index of ability classes.
        let ability = new AbilitiesIndex[key as keyof typeof AbilitiesIndex](level, quickSlot);

        // Ensure the ability has valid data.
        if (!ability.isValid())
            return log.warning(`[${this.player.username}] Invalid ability: ${key}`);

        // On level change listener for the ability.
        ability.onLevel(this.handleLevel.bind(this));

        // Add the ability to the player's abilities.
        this.abilities[key] = ability;

        /**
         * We create a callback only if the ability is not being loaded from the
         * database. This is because the serialize batch packet will be sent
         * instead of the individual ability packets.
         */

        if (!skipAddCallback) this.addCallback?.(ability);
    }

    /** */

    public setLevel(key: string, level: number): void {
        this.abilities[key]?.setLevel(level);
    }

    /**
     * Iterates through the player's abilities and serializes the ability information.
     * @param includeType Whether or not to include the type of the ability.
     * @returns A SerializedAbility object containing the player's abilities.
     */

    public serialize(includeType = false): SerializedAbility {
        let abilities: AbilityData[] = [];

        _.each(this.abilities, (ability: Ability) =>
            abilities.push(ability.serialize(includeType))
        );

        return {
            abilities
        };
    }

    /**
     * Callback for when the abilities have loaded from the database.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }

    /**
     * Callback for when a new ability is added.
     * @param callback The ability that is being added.
     */

    public onAdd(callback: AddCallback): void {
        this.addCallback = callback;
    }
}
