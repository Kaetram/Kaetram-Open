import _ from 'lodash';

import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Character from '@kaetram/server/src/game/entity/character/character';

const MAX_MINIONS = 10;

export default class SkeletonKing extends Default {
    private minions: Mob[] = [];

    public constructor(mob: Mob) {
        super(mob);

        setInterval(() => this.spawn, 15_000);
    }

    /**
     * Override for the handle death callback. The skeleton king must remove
     * all of its minions upon death.
     * @param attacker The attacker that killed the skeleton king.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        // Clear all the minions from the list.
        _.each(this.minions, (minion: Mob) => minion.deathCallback?.());
    }

    private spawn(): void {
        // Maximum number of minions has been reached.
        if (this.minions.length >= MAX_MINIONS) return;
    }
}
