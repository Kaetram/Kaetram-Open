import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

export default class QueenAnt extends Default {
    private positions: Position[];

    private minionsSpawned = false;
    private specialAttack = false;

    public constructor(mob: Mob) {
        super(mob);

        // Spawn the mobs around the Queen Ant.
        this.positions = [
            { x: this.mob.spawnX + 3, y: this.mob.spawnY },
            { x: this.mob.spawnX - 3, y: this.mob.spawnY },
            { x: this.mob.spawnX, y: this.mob.spawnY + 3 },
            { x: this.mob.spawnX, y: this.mob.spawnY - 3 }
        ];
    }

    /**
     * Overrides the movement for the Queen Ant. When she moves, all of her minions
     * will be following her.
     */

    protected override handleMovement(): void {
        super.handleMovement();

        for (let minion of Object.values(this.minions)) minion.follow(this.mob);
    }

    /**
     * Override of hit function used to spawn minions when the Queen Ant reaches half health.
     * @param damage Damage being dealt to the mob.
     * @param attacker (Optional) The attacker who is dealing the damage.
     */

    protected override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        if (!this.isHalfHealth() || this.minionsSpawned) return;

        // Spawn minions using the positions surrounding the Queen Ant.
        for (let position of this.positions) {
            let minion = super.spawn('ant', position.x, position.y, true);

            // Prevent minion from roaming.
            minion.roaming = false;

            // Queen Ant is the target.
            minion.setTarget(this.mob);

            // Minions immediately start following the Queen Ant.
            minion.follow(this.mob);
        }

        this.minionsSpawned = true;
    }

    /**
     * Override for the respawn function. We reset the boss back
     * to default status and remove all the minion wave checks.
     */

    protected override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        // Removes all the minions from the list.
        for (let minion of Object.values(this.minions)) minion.deathCallback?.();

        this.minionsSpawned = false;
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

        // Determine whether or not to use ranged attacks.
        let useRanged =
            this.mob.getDistance(this.mob.target!) > 1 ||
            this.mob.target!.isRanged() ||
            this.mob.target!.moving;

        // Update the mob's range distance.
        this.mob.attackRange = useRanged ? 10 : 1;

        // Updates the projectile per combat loop to reset the special attack.
        if (useRanged) this.mob.projectileName = 'projectile-boulder';
    }

    /**
     * Resets the special attack ability by removing the mob's attack range.
     */

    private resetSpecialAttack(): void {
        this.specialAttack = false;
        this.mob.attackRange = 1;
    }
}
