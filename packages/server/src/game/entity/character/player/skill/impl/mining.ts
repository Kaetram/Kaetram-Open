import ResourceSkill from '../resourceskill';
import Item from '../../../../objects/item';
import Rocks from '../../../../../../../data/rocks.json';

import Utils from '@kaetram/common/util/utils';
import ResourceText from '@kaetram/common/text/en/resource';
import { Modules } from '@kaetram/common/network';

import type Player from '../../player';
import type Resource from '../../../../../entity/objects/resource/resource';

export default class Mining extends ResourceSkill {
    public constructor() {
        super(Modules.Skills.Mining, Rocks);

        this.onExhaust(this.handleExhaust.bind(this));
    }

    /**
     * Handles obtaining the resource information and sending it to the superclass
     * to process handling the random item rewarding.
     * @param player The player that is cutting the tree.
     * @param resource The resource belonging to the tree that was cut.
     */

    private handleExhaust(player: Player, resource?: Resource): void {
        // Use the superclass logic to handle the random item selection.
        super.handleRandomItems(player, Rocks[resource!.key as keyof typeof Rocks]);
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
        if (!weapon.isMining()) return player.notify(ResourceText.INVALID_WEAPON(this.type));

        // Pass the info onto the super class interact function.
        this.interact(player, rock, weapon.mining);
    }

    /**
     * Override for the skill to add support for double rewards. This is used
     * for special weekend events.
     * @param key The key of the item we are creating.
     * @returns The new item instance.
     */

    protected override getItem(key: string): Item {
        return new Item(key, -1, -1, false, Utils.doubleMining ? 2 : 1);
    }

    /**
     * Override for the `canHold` function where we check the special
     * event weekend status for double rewards.
     * @param player The player that is cutting the tree.
     * @returns Whether or not the player can hold the reward.
     */

    public override canHold(player: Player): boolean {
        return player.inventory.hasSpace(Utils.doubleMining ? 2 : 1);
    }
}
