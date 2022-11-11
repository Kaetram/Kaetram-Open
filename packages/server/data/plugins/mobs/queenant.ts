import _ from 'lodash';

import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';

import Utils from '@kaetram/common/util/utils';

export default class QueenAnt extends Default {
    private specialAttack = false;

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Every attack the queen ant has a small chance of using a special attack. A special
     * attack indicates the queen transitions to a ranged attack style, and will have a chance
     * of an AoE attack alongside terror infliction.
     */

    protected override handleAttack(): void {
        // Ignore the special attack if one is already active.
        if (this.specialAttack) return this.resetSpecialAttack();

        // 1 in 6 chance to trigger a special attack.
        if (Utils.randomInt(1, 6) !== 2) return;

        // 1 in 16 chance to trigger an AoE attack alongside special attack.
        if (Utils.randomInt(1, 16) === 6) this.mob.aoe = 4;

        this.mob.attackRange = 6;

        this.specialAttack = true;
    }

    /**
     * Resets the special attack ability by removing the mob's attack range.
     */

    private resetSpecialAttack(): void {
        this.specialAttack = false;
        this.mob.attackRange = 1;
    }
}
