import { Modules } from '@kaetram/common/network';

import type { Duration, SerializedDuration, SerializedEffects } from '@kaetram/common/types/status';

export default class {
    private effects: Modules.Effects[] = [];

    private durations: { [key: number]: Duration } = {};

    private addCallback?: (status: Modules.Effects) => void;
    private removeCallback?: (status: Modules.Effects) => void;

    /**
     * Loads the serialized status effects from the database and uses the start time
     * relative to the duration of the effect to reinstantiate it if applicable. We use
     * the calculated remaining time upon logging out to determine how long to set the
     * timeout for.
     * @param effects The list of serialized status effects from the database.
     */

    public load(effects: SerializedEffects): void {
        for (let type in effects) {
            let effect = effects[type];

            // Effect has already passed our current time, just ignore it.
            if (effect.remainingTime < 100) continue;

            this.addWithTimeout(parseInt(type), effect.remainingTime);
        }
    }

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
        if (this.durations[statusEffect]) {
            clearTimeout(this.durations[statusEffect].timeout);
            delete this.durations[statusEffect];
        }

        // Start a new effect duration handler.
        this.durations[statusEffect] = {
            // Begin the timeout and remove the status effect once it is up.
            timeout: setTimeout(() => {
                this.remove(statusEffect);

                callback?.();
            }, duration),
            startTime: Date.now() - 1000,
            duration
        };
    }

    /**
     * Removes one or more status effects from the character's list of effects.
     * @param statusEffect The status effect(s) we are removing.
     */

    public remove(...statusEffect: Modules.Effects[]): void {
        for (let status of statusEffect) {
            this.effects = this.effects.filter((effect) => effect !== status);

            // Remove the status effect from the list of durations.
            if (this.durations[status]) delete this.durations[status];

            this.removeCallback?.(status);
        }
    }

    /**
     * Removes all the effects and timeouts from the character's list of effects.
     */

    public clear(): void {
        this.effects = [];

        // Clear all the timeouts.
        for (let status in this.durations) {
            clearTimeout(this.durations[status].timeout);
            delete this.durations[status];
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
        return !!this.durations[status]?.timeout;
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
     * Serializes the status effects for storing them into the database.
     * This is to prevent people from logging out and back in to remove
     * the status effects.
     * @returns A serialized effects object containing all the currently active durations.
     */

    public serialize(): SerializedEffects {
        let effects: SerializedEffects = {};

        for (let status in this.durations) {
            let duration = this.durations[status];

            effects[status] = {
                remainingTime: duration.startTime + duration.duration - Date.now()
            } as SerializedDuration;
        }

        return effects;
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
