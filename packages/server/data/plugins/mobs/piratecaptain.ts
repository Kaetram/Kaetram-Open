import Default from './default';

import Utils from '@kaetram/common/util/utils';

import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import type Character from '@kaetram/server/src/game/entity/character/character';

const MAX_MINIONS = 8,
    TELEPORT_CHANCE = 12,
    SPAWN_CHANCE = 8;

export default class PirateCaptain extends Default {
    private minionsSpawned = 0;

    private lastPickedTeleport: Position = { x: 0, y: 0 };

    private teleportSpots: Position[] = [
        { x: 935, y: 743 },
        { x: 930, y: 755 },
        { x: 920, y: 753 },
        { x: 918, y: 743 }
    ];

    private minionSpots: Position[] = [
        { x: 923, y: 745 },
        { x: 931, y: 746 },
        { x: 929, y: 754 },
        { x: 923, y: 752 }
    ];

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Override for the death callback. Removes all the minions for the pirate captain.
     */

    public override handleDeath(attacker?: Character): void {
        super.handleDeath(attacker);

        for (let minion of Object.values(this.minions)) minion.deathCallback?.();

        this.minionsSpawned = 0;
        this.mob.attackRange = 1;
    }

    /**
     * Override for when the pirate captain is hit. We give it a random chance of spawning a minion here.
     */

    public override handleHit(damage: number, attacker?: Character): void {
        super.handleHit(damage, attacker);

        if (this.canSpawnMob()) return this.spawnMob();
        if (this.canTeleport()) return this.teleport();
    }

    /**
     * This is the teleport logic for the pirate captain. Once he starts teleporting he will
     * go to ranged-based attacks for the remainder of the fight.
     */

    private teleport(): void {
        let position = this.teleportSpots[Utils.randomInt(0, this.teleportSpots.length - 1)];

        if (position.x === this.lastPickedTeleport.x && position.y === this.lastPickedTeleport.y)
            return;

        // Stop all players from attacking the pirate captain.
        this.mob.world.cleanCombat(this.mob);

        this.mob.attackRange = 11;

        // Update the position and teleport the captain with an animation.
        this.mob.teleport(position.x, position.y, true);
    }

    /**
     * Spawns a mob for the pirate captain and begins attacking one of its attackers.
     */

    private spawnMob(): void {
        if (this.minionsSpawned >= MAX_MINIONS) return;

        let position = this.minionSpots[Utils.randomInt(0, this.minionSpots.length - 1)],
            minion = super.spawn('pirateskeleton', position.x, position.y),
            target = super.getTarget(); // Pick a random target from the attackers

        // Update the roam distance for minions (so they don't go back to spawn point).
        minion.roamDistance = 20;

        // Set the target for the minion.
        if (target) minion.combat.attack(target);

        this.minionsSpawned++;
    }

    /**
     * The pirate captain has a special ability causing him to teleport 1/12th of the time.
     * @returns A 1 in 12 chance of teleporting.
     */

    private canTeleport(): boolean {
        return Utils.randomInt(0, TELEPORT_CHANCE) === 4;
    }

    /**
     * Pirate captain has a 1/8 chance to spawn a mob.
     * @returns A 1 in 8 chance of spawning a mob.
     */

    private canSpawnMob(): boolean {
        return Utils.randomInt(0, SPAWN_CHANCE) === 4;
    }
}
