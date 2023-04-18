import ResourceSkill from '../resourceskill';
import FishingSpots from '../../../../../../../data/fishing.json';

import { Modules } from '@kaetram/common/network';
import ResourceEn from '@kaetram/common/text/en/resource';

import type Player from '../../player';
import type Resource from '../../../../../globals/impl/resource';

export default class Fishing extends ResourceSkill {
    // We want to randomize the depletion of the fishing spots.
    public override randomDepletion = true;

    public constructor() {
        super(Modules.Skills.Fishing, FishingSpots);
    }

    /**
     * Handles the action of trying to catch fish. Fishing uses the same
     * mechanism as mining and lumberjacking except we don't exhaust the
     * resource immediately after we catch a fish.
     * @param player The player that is fishing.
     * @param spot The spot at which we are fishing (used to determine info about the spot).
     */

    public catch(player: Player, spot: Resource): void {
        let weapon = player.equipment.getWeapon();

        if (!weapon.isFishing()) return player.notify(ResourceEn.INVALID_WEAPON(this.type));

        this.interact(player, spot, weapon.fishing);
    }
}
