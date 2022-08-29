import _ from 'lodash';

import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Character from '@kaetram/server/src/game/entity/character/character';

import Utils from '@kaetram/common/util/utils';

const MAX_MINIONS = 10;

export default class SkeletonKing extends Default {
    // Two positions where the minions will spawn.
    private positions: Position[] = [
        { x: 240, y: 65 },
        { x: 248, y: 65 }
    ];

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
        _.each(super.minions, (minion: Mob) => minion.deathCallback?.());
    }

    private spawnMob(): void {
        // Maximum number of minions has been reached.
        if (super.minions.length >= MAX_MINIONS) return;

        let position = this.positions[Utils.randomInt(0, this.positions.length - 1)];

        super.spawn('skeleton', position.x, position.y);
    }
}
