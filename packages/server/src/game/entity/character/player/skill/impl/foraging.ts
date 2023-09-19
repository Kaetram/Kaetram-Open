import ResourceSkill from '../resourceskill';

import { Modules } from '@kaetram/common/network';

import type Player from '../../player';
import type Resource from '../../../../../entity/objects/resource/resource';
import type { ResourceInfo } from '@kaetram/common/types/resource';

export default class Foraging extends ResourceSkill {
    public constructor() {
        super(Modules.Skills.Foraging);
    }

    /**
     * Handles harvesting a resource. Here we check if the player has
     * the appropriate tools or level to harvest the resource. Some
     * resources don't require tools and can be harvested at any level.
     * @param player The player that is performing the harvesting procedure.
     * @param spot The spot at which the player is harvesting (used to determine info about the spot).
     */

    public harvest(player: Player, spot: Resource): void {
        // Nothing for now, add tools later.

        this.interact(player, spot);
    }

    /**
     * Override for the exhaust probability function. Since foraging is a lot more of a
     * walk-around-and-collect skill, we modify the probability of exhausting the resource.
     * @param level The level of the tool being used to harvest the resource.
     * @param info The resource info object.
     */

    protected override canExhaustResource(level: number, info: ResourceInfo): boolean {
        // For now this defaults to true. we complicate foraging later.
        return true;
    }
}
