import ResourceSkill from '../resourceskill';
import Rocks from '../../../../../../../data/rocks.json';

import ResourceEn from '@kaetram/common/text/en/resource';
import { Modules } from '@kaetram/common/network';

import type Player from '../../player';
import type Resource from '../../../../../globals/impl/resource';

export default class Mining extends ResourceSkill {
    public constructor() {
        super(Modules.Skills.Mining, Rocks);
    }

    /**
     * The interaction logic for the rock. We ensure the player has the correct
     * weapon equipped and pass the data onto the superclass `interact` function.
     * @param player The player that is mining the rock.
     * @param rock The rock instance that we are attempting to mine.
     */

    public mine(player: Player, rock: Resource): void {
        let weapon = player.equipment.getWeapon();

        // Player's weapon is not a valid mining weapon.
        if (!weapon.isMining()) return player.notify(ResourceEn.INVALID_WEAPON(this.type));

        // Pass the info onto the super class interact function.
        this.interact(player, rock, weapon.mining);
    }
}
