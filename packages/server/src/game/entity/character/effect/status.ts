import { Modules } from '@kaetram/common/network';

export default class {
    private effects: Modules.Effects[] = [];

    private timeouts: { [key: number]: NodeJS.Timeout } = {};

    private addCallback?: (status: Modules.Effects) => void;
    private removeCallback?: (status: Modules.Effects) => void;

    /**
     * Adds a status effect to the character's list of effects if it has not
     * already been added. Effects can only be applied once.
     * @param statusEffect The new status(es) effect we are adding.
     */

    public add(...statusEffect: Modules.Effects[]): void {
        for (let status of statusEffect) {
            // Don't add the effect if it already exists.
            if (this.has(status)) continue;

            this.effects.push(status);

            this.addCallback?.(status);
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
        statusEffect: Modules.Effects,
        duration: number,
        callback?: () => void
    ): void {
        // A temporary freezing effect cannot be added if the player has a permanent one.
        if (statusEffect === Modules.Effects.Freezing && this.hasPermanentFreezing()) return;

        this.add(statusEffect);

        // Clear existing timeouts.
        if (this.timeouts[statusEffect]) {
            clearTimeout(this.timeouts[statusEffect]);
            delete this.timeouts[statusEffect];
        }

        // Start a new timeout.
        this.timeouts[statusEffect] = setTimeout(() => {
            this.remove(statusEffect);

            callback?.();
        }, duration);
    }

    /**
     * Removes one or more status effects from the character's list of effects.
     * @param statusEffect The status effect(s) we are removing.
     */

    public remove(...statusEffect: Modules.Effects[]): void {
        for (let status of statusEffect) {
            this.effects = this.effects.filter((effect) => effect !== status);

            this.removeCallback?.(status);
        }
    }

    /**
     * Removes all the effects and timeouts from the character's list of effects.
     */

    public clear(): void {
        this.effects = [];

        // Clear all the timeouts.
        for (let status in this.timeouts) {
            clearTimeout(this.timeouts[status]);
            delete this.timeouts[status];
        }
    }

    /**
     * Checks the array of status effects to see if the character has the status effect.
     * @param statusEffect The status effect we are checking the existence of.
     * @returns Whether or not the character has the status effect in the array of effects.
     */

    public has(status: Modules.Effects): boolean {
        return this.effects.includes(status);
    }

    /**
     * Checks whether or not the character has a status effect with a timeout.
     * @param status The status effect we are checking the existence of.
     * @returns Whether or not there is an existent timeout for the status effect.
     */

    public hasTimeout(status: Modules.Effects): boolean {
        return !!this.timeouts[status];
    }

    /**
     * Permanent freezing is applied when in an area with freezing effect. This one does not
     * have a timeout and can only be removed by leaving the area (or temporarily prevented
     * by using a snow potion).
     * @returns Whether we have the freezing effect and no timeout associated with it.
     */

    private hasPermanentFreezing(): boolean {
        return this.has(Modules.Effects.Freezing) && !this.hasTimeout(Modules.Effects.Freezing);
    }

    /**
     * Iterates through all the active status effects and executes the callback function.
     * @param callback Contains the status effect we are iterating through currently.
     */

    public forEachEffect(callback: (status: Modules.Effects) => void): void {
        for (let status of this.effects) callback(status);
    }

    /**
     * Callback for when a status effect is added onto the player.
     * @param callback The status effect we are adding.
     */

    public onAdd(callback: (status: Modules.Effects) => void): void {
        this.addCallback = callback;
    }

    /**
     * Callback for when a status effect is removed from the player.
     * @param callback The status effect we are removing.
     */

    public onRemove(callback: (status: Modules.Effects) => void): void {
        this.removeCallback = callback;
    }
}
