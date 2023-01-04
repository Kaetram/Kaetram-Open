import { Modules } from '@kaetram/common/network';

export default class Poison {
    public name;
    public damage;
    public duration;
    public rate;

    /**
     * Initializes an object of poison that can be stored in a character.
     * @param type The type of poison entity is suffering from.
     * @param start Epoch time of when the poison started.
     */

    public constructor(public type: Modules.PoisonTypes, public start = Date.now()) {
        if (!this.start) this.start = Date.now();

        this.name = Modules.PoisonInfo[this.type].name;
        this.damage = Modules.PoisonInfo[this.type].damage;
        this.duration = Modules.PoisonInfo[this.type].duration * 1000; // Convert to milliseconds
        this.rate = Modules.PoisonInfo[this.type].rate * 1000; // Convert to milliseconds
    }

    /**
     * Checks if the poison status has expired. A poison with the duration of
     * -1 will never expire until it is cured.
     * @returns If the time difference between when poison started and now is
     * greater than the duration of the poison.
     */

    public expired(): boolean {
        if (this.duration < 0) return false;

        return Date.now() - this.start >= this.duration;
    }

    /**
     * @returns The remaining amount of time in the poison effect. Used for
     * loading once the player logs back in to the game.
     */

    public getRemainingTime(): number {
        return this.duration - (this.duration - (Date.now() - this.start));
    }
}
