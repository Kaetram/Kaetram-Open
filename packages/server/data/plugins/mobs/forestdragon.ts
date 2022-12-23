import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Character from '@kaetram/server/src/game/entity/character/character';
import Utils from '@kaetram/common/util/utils';

export default class ForestDragon extends Default {
    private specialAttack = false;

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Every attack the Queen Ant has a small chance of using a special attack. A special
     * attack indicates the queen transitions to a ranged attack style, and will have a chance
     * of an AoE attack alongside terror infliction.
     */

    protected override handleAttack(): void {
        super.handleAttack();

        // Ignore the special attack if one is already active.
        if (this.specialAttack) return this.resetSpecialAttack();

        // 1 in 3 chance to trigger a special attack.
        if (Utils.randomInt(1, 3) !== 2) return;

        // Queen ant attacks with range and inflicts terror.
        this.mob.attackRange = 9;
        this.mob.projectileName = 'projectile-terror';

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
