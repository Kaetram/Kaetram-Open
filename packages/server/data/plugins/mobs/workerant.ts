import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Character from '@kaetram/server/src/game/entity/character/character';

export default class WorkerAnt extends Default {
    private healInterval: NodeJS.Timeout | null;

    public constructor(mob: Mob) {
        super(mob);

        this.healInterval = setInterval(this.handleHeal.bind(this), 5000);
    }

    /**
     * Overrides the superclass hit such that the worker ant does not
     * respond to being attacked by the player. This plugin is used
     * by minion worker ants that are spawned by the Queen Ant mob.
     */

    protected override handleHit(): void {
        //
    }

    /**
     * Overrides the death function from the superclass. We clear the heal interval
     * when the worker ant is killed.
     * @param attacker Unused parameter that indicates the attacker who killed the mob.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        if (!this.healInterval) return;

        // Clear the interval.
        clearInterval(this.healInterval);
        this.healInterval = null;
    }

    /**
     * Heals the target of the worker ant.
     */

    private handleHeal(): void {
        if (!this.mob.hasTarget()) return;
    }
}
