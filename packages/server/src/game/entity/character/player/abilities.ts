import AbilitiesIndex from './ability/impl/index';

import { Ability as AbilityPacket } from '../../../../network/packets';

import { Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type { AbilityData, SerializedAbility } from '@kaetram/common/types/ability';
import type Ability from './ability/ability';
import type Player from './player';

type AddCallback = (ability: Ability) => void;
type ToggleCallback = (key: string) => void;

export default class Abilities {
    private abilities: { [key: string]: Ability } = {}; // All the abilities that the player has.

    private loadCallback?: () => void;
    private addCallback?: AddCallback;
    public toggleCallback?: ToggleCallback;

    public constructor(private player: Player) {}

    /**
     * Loads the abilities from the database. The serialized abilities are loaded
     * into the `abilities` array.
     * @param info Contains the abilities and quick slot information.
     */

    public load(info: SerializedAbility): void {
        for (let ability of info.abilities)
            this.add(ability.key, ability.level, ability.quickSlot, true);

        this.loadCallback?.();
    }

    /**
     * Sends a packet to the player when an ability undergoes a change in level.
     * @param key The key of the ability that has changed.
     * @param level The new level of the ability.
     * @param quickSlot The quick slot id that the ability is in.
     */

    private handleUpdate(key: string, level: number, quickSlot: number): void {
        this.player.send(
            new AbilityPacket(Opcodes.Ability.Update, {
                key,
                level,
                quickSlot
            })
        );
    }

    /**
     * Activates an ability based on the key.
     * @param key The key of the ability to activate.
     */

    public use(key: string): void {
        this.abilities[key]?.activate(this.player);
    }

    /**
     * Uses the ability key to find the ability subclass and creates an object
     * based on that. The level is passed to the subclass constructor.
     * @param key The key of the ability we are creating.
     * @param level The level of the ability.
     * @param quickSlot The identification of the quick slot.
     * @param skipAddCallback Whether or not to skip the add callback.
     */

    public add(key: string, level: number, quickSlot = -1, skipAddCallback = false): void {
        // Ensure the ability exists within the index.
        if (!(key in AbilitiesIndex)) return log.warning(`Ability ${key} does not exist.`);

        // If the ability already exists, we just update the level.
        if (this.has(key)) return this.setLevel(key, level);

        // Create ability based on the key from index of ability classes.
        let ability = new AbilitiesIndex[key as keyof typeof AbilitiesIndex](
            level,
            quickSlot
        ) as Ability;

        // Ensure the ability has valid data.
        if (!ability?.isValid())
            return log.warning(`[${this.player.username}] Invalid ability: ${key}`);

        // On ability update listener.
        ability.onUpdate(this.handleUpdate.bind(this));

        // Add the ability to the player's abilities.
        this.abilities[key] = ability;

        /**
         * We create a callback only if the ability is not being loaded from the
         * database. This is because the serialize batch packet will be sent
         * instead of the individual ability packets.
         */

        if (!skipAddCallback) this.addCallback?.(ability);
    }

    /**
     * Checks if the player already has the ability.
     * @param key The key of the ability to check.
     * @returns Whether the ability exists in the ability dictionary.
     */

    public has(key: string): boolean {
        return key in this.abilities;
    }

    /**
     * Updates an ability's level given a key.
     * @param key The key of the ability we are updating.
     * @param level The level we are setting the ability to.
     */

    public setLevel(key: string, level: number): void {
        this.abilities[key]?.setLevel(level);
    }

    /**
     * Updates the quickslot id of the ability.
     * @param key The key of the ability we are updating.
     * @param quickSlot The quickslot id we are setting the ability to.
     */

    public setQuickSlot(key: string, quickSlot: number): void {
        // Clears a quick slot from another ability if it is found.
        for (let ability of Object.values(this.abilities))
            if (ability.hasQuickSlot(quickSlot)) ability.setQuickSlot(-1);

        // Updates the quick slot of the ability.
        this.abilities[key]?.setQuickSlot(quickSlot);
    }

    /**
     * Resets all the abilities.
     */

    public reset(): void {
        this.abilities = {};

        // Signal to the client to reload the abilities.
        this.loadCallback?.();
    }

    /**
     * Iterates through the player's abilities and serializes the ability information.
     * @param includeType Whether or not to include the type of the ability.
     * @returns A SerializedAbility object containing the player's abilities.
     */

    public serialize(includeType = false): SerializedAbility {
        let abilities: AbilityData[] = [];

        for (let ability of Object.values(this.abilities))
            abilities.push(ability.serialize(includeType));

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

    /**
     * Callback for when the ability is toggled. This occurs
     * when the ability is activated or when it is deactivated.
     * @param callback Contains the key of the ability that was toggled.
     */

    public onToggle(callback: ToggleCallback): void {
        this.toggleCallback = callback;
    }
}
