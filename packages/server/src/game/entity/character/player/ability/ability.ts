import Player from '../player';

import log from '@kaetram/common/util/log';
import { AbilityData, AbilityInfo, SerializedAbility } from '@kaetram/common/types/ability';

import Data from '../../../../../../data/abilities.json';

type DeactivateCallback = (player: Player) => void;
export default class Ability {
    private data: AbilityInfo;

    private lastActivated = 0;

    private deactivateCallback?: DeactivateCallback;

    public constructor(public key: string, private level: number) {
        this.data = (Data as AbilityData)[this.key];
    }

    /**
     * Superclass implementation for when an ability is activated.
     * @param _player Player parameter that will be used by subclasses.
     */

    public activate(player: Player): void {
        // Passive abilities are not activated.
        if (this.data.type !== 'active' || !this.data.levels) return;

        let { cooldown, duration, mana } = this.data.levels[this.level];

        // Someone somewhere forgot to specify a mana cost for the ability.
        if (!mana) return log.warning(`Ability ${this.key} has no mana cost.`);

        // Ensure active abilities have a cooldown and duration.
        if (!cooldown || !duration)
            return log.warning(`Ability ${this.key} has no cooldown or duration.`);

        // Player doesn't have enough mana.
        if (player.mana.getMana() < mana)
            return player.notify('You do not have enough mana to use this ability.');

        // Ensure the ability is not on cooldown.
        if (this.isCooldown(cooldown))
            return player.notify(
                `You need to wait ${Math.floor(
                    cooldown - (Date.now() - this.lastActivated)
                )} seconds before using this ability again.`
            );

        // Remove the ability mana cost from the player.
        player.mana.decrement(mana);

        // Ability will deactivate and create a callback after `duration` milliseconds.
        setTimeout(() => this.deactivateCallback?.(player), duration);

        // Update the date of the last time the ability was activated.
        this.lastActivated = Date.now();
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
     * Serializes the ability's information into an AbilityData object.
     * @returns An AbilityData object containing necessary data for database storage.
     */

    public serialize(): SerializedAbility {
        return {
            key: this.key,
            level: this.level
        };
    }

    /**
     * Callback for when the ability has been deactivated.
     * @param callback Contains the player parameter.
     */

    public onDeactivate(callback: DeactivateCallback): void {
        this.deactivateCallback = callback;
    }
}
