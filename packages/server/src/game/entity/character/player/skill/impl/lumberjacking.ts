import ResourceSkill from '../resourceskill';
import Trees from '../../../../../../../data/trees.json';

import ResourceEn from '@kaetram/common/text/en/resource';
import { Modules } from '@kaetram/common/network';

import type Player from '../../player';
import type Resource from '../../../../../globals/impl/resource';

export default class Lumberjacking extends ResourceSkill {
    public constructor() {
        super(Modules.Skills.Lumberjacking, Trees);
    }

    /**
     * Ensures that the player has the correct weapon equipped for cutting trees
     * and passes the data onto the superclass `interact` function.
     * @param player The player that is cutting the tree.
     * @param tree The tree instance that we are attempting to cut.
     */

    public cut(player: Player, tree: Resource): void {
        let weapon = player.equipment.getWeapon();

        // Player's weapon is not a valid lumberjacking weapon.
        if (!weapon.isLumberjacking()) return player.notify(ResourceEn.INVALID_WEAPON(this.type));

        if (!player.quests.canCutTreesInTutorial()) return player.notify(ResourceEn.NO_REASON);

        this.interact(player, tree, weapon.lumberjacking);
    }
}
