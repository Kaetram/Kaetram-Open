import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Handler from '@kaetram/server/src/game/entity/character/mob/handler';

/**
 * Default handler plugin for the mob. When a mob has a plugin associated
 * with it, instead of loading the default handler, we load the plugin with
 * callback functions special to the mob.
 */

export default class Default extends Handler {
    // Support for minion spawning. Since a lot of bosses may spawn minions.
    protected minions: Mob[] = [];

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Creates a mob given the key and position, and creates the necessary callbacks
     * and handlers for its death.
     * @param key The key of the mob to spawn.
     * @param x The x grid coordinate to spawn the mob at.
     * @param y The y grid coordinate to spawn the mob at.
     * @returns The spawned minion object.
     */

    protected spawn(key: string, x: number, y: number): Mob {
        let minion = this.world.entities.spawnMob(key, x, y);

        // Prevent minion from respawning after death.
        minion.respawnable = false;

        // Remove the minion from the list when it dies.
        minion.onDeathImpl(() => {
            this.minions.splice(this.minions.indexOf(minion), 1);
        });

        // Add the minion to the list.
        this.minions.push(minion);

        return minion;
    }
}
