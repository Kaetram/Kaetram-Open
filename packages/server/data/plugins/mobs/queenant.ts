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
        super.handleAttack();

        // Ignore the special attack if one is already active.
        if (this.specialAttack) return this.resetSpecialAttack();

        // 1 in 3 chance to trigger a special attack.
        if (Utils.randomInt(1, 3) !== 2) return;

        // 1 in 6 chance to trigger an AoE attack alongside special attack.
        if (Utils.randomInt(1, 6) === 3) this.mob.aoe = 4;

        // Queen ant attacks with range and inflicts terror.
        this.mob.attackRange = 6;
        this.mob.projectileName = 'projectile-terror';

        this.specialAttack = true;
    }

    /**
     * Updates the attack style with each call of the combat loop.
     */

    protected override handleCombatLoop(): void {
        super.handleCombatLoop();

        if (this.specialAttack) return;

        // Queen Ant turns to ranged attack style if the target is too far away.
        if (this.mob.getDistance(this.mob.target!) > 1) {
            this.mob.attackRange = 6;
            this.mob.projectileName = 'projectile-boulder';
        }

        this.mob.attackRange = this.mob.target?.isRanged() ? 8 : 1;
    }

    /**
     * Resets the special attack ability by removing the mob's attack range.
     */

    private resetSpecialAttack(): void {
        this.specialAttack = false;
        this.mob.attackRange = 1;
    }
}
