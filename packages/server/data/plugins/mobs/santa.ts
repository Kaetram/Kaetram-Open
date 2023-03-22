import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

export default class Santa extends Default {
    private healed = false;

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Override for the hit callback. Santa heals when his health falls below 50%.
     * @param damage Damage being dealt to the mob.
     * @param attacker (Optional) The attacker who is dealing the damage.
     */

    protected override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        if (this.healed) return;
        if (!this.isHalfHealth()) return;

        this.healed = true;

        // Heals santa by 33% of his max health.
        let healAmount = Math.floor(this.mob.hitPoints.getMaxHitPoints() / 3);

        this.mob.heal(healAmount);

        // Send a message to the player.
        this.mob.talkCallback?.(`The power of Christmas heals me!`);
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

        // Add aoe to the projectile number 6.
        if (projectile === 6) this.mob.aoe = 4;
    }
}
