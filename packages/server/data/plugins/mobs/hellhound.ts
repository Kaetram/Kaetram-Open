import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import type Character from '@kaetram/server/src/game/entity/character/character';

const MAX_MINIONS = 8;

export default class Hellhound extends Default {
    // Positions where minions will spawn.
    private positions: Position[] = [
        { x: 1059, y: 765 },
        { x: 1047, y: 768 }
    ];

    private minionsSpawned = 0;

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Override for the hit handler callback. Whenever the hellhound is hit by
     * a character he has a 1/6 chance to spawn a minion.
     * @param damage The amount of damage that was dealt.
     * @param attacker The attacker that dealt the damage.
     */

    protected override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        // Add a random chance (1/4) to spawn a minion.
        if (Utils.randomInt(1, 6) === 2) this.spawnMob();
    }

    /**
     * Updates the attack style with each call of the combat loop.
     */

    protected override handleCombatLoop(): void {
        super.handleCombatLoop();

        // Determine whether or not to use ranged attacks.
        let useRanged =
            this.mob.getDistance(this.mob.target!) > 1 ||
            this.mob.target!.isRanged() ||
            this.mob.target!.moving;

        // Update the mob's range distance.
        this.mob.attackRange = useRanged ? 12 : 1;
    }

    /**
     * Spawns a minion and checks the limit of minions.
     */

    private spawnMob(): void {
        // Maximum number of minions has been reached.
        if (this.minionsSpawned >= MAX_MINIONS) return;

        let minionKey = Utils.randomInt(0, 1) === 0 ? 'darkwolf' : 'blackwizard',
            position =
                minionKey === 'blackwizard'
                    ? this.positions[Utils.randomInt(0, this.positions.length - 1)]
                    : { x: this.mob.x, y: this.mob.y },
            minion = super.spawn(minionKey, position.x, position.y),
            target = super.getTarget();

        // Minions have the same roaming distance as the skeleton king.
        minion.roamDistance = this.mob.roamDistance;

        // Increase the attack range of the black wizard minion.
        if (minionKey === 'blackwizard') minion.attackRange = 16;

        if (target) minion.combat.attack(target);

        this.minionsSpawned++;
    }

    /**
     * Override for the handle death callback. Remove the minions and
     * reset the minion spawn count.
     * @param attacker The attacker that killed the mob.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        // Clear all the minions from the list.
        for (let minion of Object.values(this.minions)) minion.deathCallback?.();

        // Reset minion spawn count.
        this.minionsSpawned = 0;
    }
}
