import Utils from '@kaetram/common/util/utils';
import Handler from '@kaetram/server/src/game/entity/character/mob/handler';

import type Character from '@kaetram/server/src/game/entity/character/character';
import type Mob from '@kaetram/server/src/game/entity/character/mob/mob';

/**
 * Default handler plugin for the mob. When a mob has a plugin associated
 * with it, instead of loading the default handler, we load the plugin with
 * callback functions special to the mob.
 */

export default class Default extends Handler {
    // Support for minion spawning. Since a lot of bosses may spawn minions.
    protected minions: { [instance: string]: Mob } = {};

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Creates a mob given the key and position, and creates the necessary callbacks
     * and handlers for its death.
     * @param key The key of the mob to spawn.
     * @param x The x grid coordinate to spawn the mob at.
     * @param y The y grid coordinate to spawn the mob at.
     * @param plugin (Optional) Whether or not the mob initializes a plugin based on its key.
     * @returns The spawned minion object.
     */

    protected spawn(key: string, x: number, y: number, plugin = false): Mob {
        let minion = this.world.entities.spawnMob(key, x, y, plugin);

        // Prevent minion from respawning after death.
        minion.respawnable = false;

        // Remove the minion from the list when it dies.
        minion.onDeathImpl(() => delete this.minions[minion.instance]);

        // Add the minion to the list.
        this.minions[minion.instance] = minion;

        return minion;
    }

    /**
     * Grabs a target from the mob's attackers list.
     * @returns A character object if a target was found, otherwise undefined.
     */

    protected getTarget(): Character | undefined {
        // Skip if no attackers but somehow the boss got hit.
        if (this.mob.attackers.length === 0) return;

        // Find an attacker out of the list of attackers.
        let target = this.mob.attackers[Utils.randomInt(0, this.mob.attackers.length - 1)];

        return target;
    }

    /**
     * @returns Whether or not the boss is halfway through his health.
     */

    protected isHalfHealth(): boolean {
        return this.mob.hitPoints.getHitPoints() / this.mob.hitPoints.getMaxHitPoints() <= 0.5;
    }

    /**
     * @returns Whether or not the boss has one quarter of his life left.
     */

    protected isQuarterHealth(): boolean {
        return this.mob.hitPoints.getHitPoints() / this.mob.hitPoints.getMaxHitPoints() <= 0.25;
    }
}
