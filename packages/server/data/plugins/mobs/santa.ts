import Utils from '@kaetram/common/util/utils';

import Default from './default';

import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

export default class Santa extends Default {
    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Every attack we pick a different projectile to throw.
     */

    protected override handleAttack(): void {
        super.handleAttack();

        // Generate a random projectile between 1 and 6 and set the projectile name.
        let projectile = Utils.randomInt(1, 6),
            name = `projectile-gift${projectile === 1 ? '' : projectile}`;

        this.mob.projectileName = name;
    }
}
