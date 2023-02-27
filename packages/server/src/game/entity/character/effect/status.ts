import type { Modules } from '@kaetram/common/network';

export default class {
    private effects: Modules.StatusEffect[] = [];

    private timeouts: { [key: number]: NodeJS.Timeout } = {};

    /**
     * Adds a status effect to the character's list of effects if it has not
     * already been added. Effects can only be applied once.
     * @param statusEffect The new status(es) effect we are adding.
     */

    public add(...statusEffect: Modules.StatusEffect[]): void {
        for (let status of statusEffect) {
            // Don't add the effect if it already exists.
            if (this.has(status)) return;

            this.effects.push(status);
        }
    }

    /**
     * Adds a status effect to the character's list and sets a timeout with the specified
     * duration. Once the timeout is up, the status effect will be removed and the callback
     * function is executed.
     * @param statusEffect The status effect we are adding.
     * @param callback The callback function to execute once the timeout is up.
     * @param duration Duration until the timeout is up.
     */

    public addWithTimeout(
        statusEffect: Modules.StatusEffect,
        callback: () => void,
        duration: number
    ): void {
        this.add(statusEffect);

        // Clear existing timeouts.
        if (this.timeouts[statusEffect]) clearTimeout(this.timeouts[statusEffect]);

        // Start a new timeout.
        this.timeouts[statusEffect] = setTimeout(() => {
            this.remove(statusEffect);

            callback();
        }, duration);
    }

    /**
     * Removes one or more status effects from the character's list of effects.
     * @param statusEffect The status effect(s) we are removing.
     */

    public remove(...statusEffect: Modules.StatusEffect[]): void {
        for (let status of statusEffect)
            this.effects = this.effects.filter((effect) => effect !== status);
    }

    /**
     * Checks the array of status effects to see if the character has the status effect.
     * @param statusEffect The status effect we are checking the existence of.
     * @returns Whether or not the character has the status effect in the array of effects.
     */

    public has(status: Modules.StatusEffect): boolean {
        return this.effects.includes(status);
    }
}
