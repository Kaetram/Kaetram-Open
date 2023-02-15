import Data from '../../../../../../data/abilities.json';

import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type { AbilityData, RawAbility } from '@kaetram/common/types/ability';
import type Player from '../player';

type DeactivateCallback = (player: Player) => void;
type UpdateCallback = (key: string, level: number, quickSlot: number) => void;
export default class Ability {
    private data: RawAbility;

    private lastActivated = 0;

    private deactivateCallback?: DeactivateCallback;
    private updateCallback?: UpdateCallback;

    public constructor(public key: string, private level = 1, private quickSlot = -1) {
        this.data = (Data as RawAbility)[this.key];
    }

    /**
     * Superclass implementation for when an ability is activated.
     * @param player The player object that activated the ability.
     */

    public activate(player: Player): boolean {
        // Passive abilities are not activated.
        if (this.data.type !== 'active' || !this.data.levels) return false;

        let { cooldown, duration, mana } = this.data.levels[this.level];

        // Someone somewhere forgot to specify a mana cost for the ability.
        if (!mana) {
            log.warning(`Ability ${this.key} has no mana cost.`);
            return false;
        }

        // Ensure active abilities have a cooldown and duration.
        if (!cooldown || !duration) {
            log.warning(`Ability ${this.key} has no cooldown or duration.`);
            return false;
        }

        // Player doesn't have enough mana.
        if (player.mana.getMana() < mana) {
            player.notify('You do not have enough mana to use this ability.');
            return false;
        }

        // Ensure the ability is not on cooldown.
        if (this.isCooldown(cooldown)) {
            player.notify(
                `You need to wait ${Math.floor(
                    (cooldown - (Date.now() - this.lastActivated)) / 1000
                )} seconds before using this ability again.`
            );
            return false;
        }

        player.abilities.toggleCallback?.(this.key);

        // Remove the ability mana cost from the player.
        player.mana.decrement(mana);

        // Ability will deactivate and create a callback after `duration` milliseconds.
        setTimeout(() => {
            this.deactivateCallback?.(player);

            // Send a packet to the client to untoggle the ability.
            player.abilities.toggleCallback?.(this.key);
        }, duration);

        // Update the date of the last time the ability was activated.
        this.lastActivated = Date.now();

        return true;
    }

    /**
     * Ensures the integrity of the ability data.
     * @returns True if the ability data exists, false otherwise.
     */

    public isValid(): boolean {
        return !!this.data;
    }

    /**
     * Checks if the ability is still in cooldown.
     * @param cooldown The cooldown integer value of an ability.
     * @returns Whether or not the ability is still in cooldown.
     */

    private isCooldown(cooldown: number): boolean {
        return Date.now() - this.lastActivated < cooldown;
    }

    /**
     * Verifies if an ability has a quick slot assigned to it or if a parameter
     * is specified then whether or not that quick slot is assigned to the ability.
     * @param quickSlot Optional parameter to check if the ability is assigned to a specific quick slot.
     * @returns Whether or not the ability has a quick slot assigned to it or specified quick slot matches.
     */

    public hasQuickSlot(quickSlot?: number): boolean {
        return quickSlot === undefined ? this.quickSlot > -1 : this.quickSlot === quickSlot;
    }

    /**
     * The type of ability using the Modules enum.
     * @returns The type of ability.
     */

    public getType(): Modules.AbilityType {
        return this.data.type === 'active'
            ? Modules.AbilityType.Active
            : Modules.AbilityType.Passive;
    }

    /**
     * Sets the level of the ability and creates a callback.
     * @param level The new level of the ability.
     */

    public setLevel(level: number): void {
        // Ability levels range from 1-4.
        if (level < 1) level = 1;
        if (level > 4) level = 4;

        this.level = level;

        this.updateCallback?.(this.key, level, this.quickSlot);
    }

    /**
     * Assigns a quick slot id to the ability.
     * @param quickSlot The quickSlot id to assign.
     */

    public setQuickSlot(quickSlot: number): void {
        if (quickSlot < 0) quickSlot = -1;
        if (quickSlot > 4) quickSlot = 4;

        this.quickSlot = quickSlot;

        this.updateCallback?.(this.key, this.level, quickSlot);
    }

    /**
     * Serializes the ability's information into an AbilityData object.
     * @param includeType Includes the ability type in the serialized object.
     * @returns An AbilityData object containing necessary data for database storage.
     */

    public serialize(includeType = false): AbilityData {
        let data: AbilityData = {
            key: this.key,
            level: this.level,
            quickSlot: this.quickSlot
        };

        if (includeType) data.type = this.getType() as number;

        return data;
    }

    /**
     * Callback for when the ability has been deactivated.
     * @param callback Contains the player parameter.
     */

    public onDeactivate(callback: DeactivateCallback): void {
        this.deactivateCallback = callback;
    }

    /**
     * Callback for when the ability has undergone an update (level or quickSlot).
     */

    public onUpdate(callback: UpdateCallback): void {
        this.updateCallback = callback;
    }
}
