import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

const MAX_MINIONS = 6;

export default class SkeletonKing extends Default {
    // Two positions where the minions will spawn.
    private positions: Position[] = [
        { x: 143, y: 403 },
        { x: 152, y: 403 }
    ];

    private minionsSpawned = 0;

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Override for the hit handler callback. We spawn minions whenever the skeleton
     * king is hit by a character.
     * @param damage The amount of damage that was dealt.
     * @param attacker The attacker that dealt the damage.
     */

    protected override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        // Add a random chance (1/4) to spawn a minion.
        if (Utils.randomInt(1, 4) === 2) this.spawnMob();
    }

    /**
     * Override for the handle death callback. The skeleton king must remove
     * all of its minions upon death.
     * @param attacker The attacker that killed the skeleton king.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        // Clear all the minions from the list.
        for (let minion of Object.values(this.minions)) minion.deathCallback?.();

        // Reset minion spawn count.
        this.minionsSpawned = 0;
    }

    /**
     * Spawns a minion and checks the limit of minions.
     */

    private spawnMob(): void {
        // Maximum number of minions has been reached.
        if (this.minionsSpawned >= MAX_MINIONS) return;

        let position = this.positions[Utils.randomInt(0, this.positions.length - 1)],
            minion = super.spawn('skeleton', position.x, position.y),
            target = super.getTarget();

        // Minions have the same roaming distance as the skeleton king.
        minion.roamDistance = this.mob.roamDistance;

        if (target) minion.combat.attack(target);

        this.minionsSpawned++;
    }
}
