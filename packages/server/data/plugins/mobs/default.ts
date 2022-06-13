import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Handler from '@kaetram/server/src/game/entity/character/mob/handler';

/**
 * Default handler plugin for the mob. When a mob has a plugin associated
 * with it, instead of loading the default handler, we load the plugin with
 * callback functions special to the mob.
 */

export default class Default extends Handler {
    public constructor(mob: Mob) {
        super(mob);
    }
}
