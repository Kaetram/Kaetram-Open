import ResourceSkill from '../resourceskill';

import Utils from '@kaetram/common/util/utils';
import ResourceText from '@kaetram/common/text/en/resource';
import { Modules } from '@kaetram/common/network';

import type Player from '../../player';
import type Resource from '../../../../../entity/objects/resource/resource';

export default class Fishing extends ResourceSkill {
    // We want to randomize the depletion of the fishing spots.
    public override randomDepletion = true;

    public constructor() {
        super(Modules.Skills.Fishing);

        this.onExhaust(this.handleExhaust.bind(this));
    }

    /**
     * After the player has caught a fish, we have a random chance of giving
     * them kelp (or any random item in the future if we want).
     * @param player The player that is receiving the kelp.
     */

    private handleExhaust(player: Player): void {
        // Failed to roll against the chance of receiving kelp.
        if (!this.canReceiveKelp()) return;

        // Create an item and make it belong to the player so others can't pick it up.
        let item = this.getItem('kelp', player.username);

        // If the player has space in their inventory add the kelp there, otherwise drop it on the ground.
        if (this.canHold(player)) player.inventory.add(item);
        else player.world.entities.addItem(item);
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

        if (!weapon.isFishing()) return player.notify(ResourceText.INVALID_WEAPON(this.type));

        this.interact(player, spot, weapon.fishing);
    }

    /**
     * Whether or not on this current depletion the player can receive kelp.
     * @returns A 10% chance of receiving kelp using a random function.
     */

    private canReceiveKelp(): boolean {
        return Utils.randomInt(0, 100) <= 10;
    }
}
