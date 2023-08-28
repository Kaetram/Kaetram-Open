import Quest from '../quest';
import Data from '../../../../../../../data/quests/evilsanta.json';

import log from '@kaetram/common/util/log';

import type Player from '../../player';
import type { ProcessedDoor } from '@kaetram/common/types/map';

export default class EvilSanta extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }

    /**
     * Override for the quest to prevent players from going through a door prior
     * to completing a certain stage.
     * @param door The door that the player is trying to enter through.
     * @param player The player that is trying to enter through the door.
     */

    protected override handleDoor(door: ProcessedDoor, player: Player): void {
        log.debug(`[${this.name}] Door: ${door.x}-${door.y} - stage: ${this.stage}.`);

        if (this.stage === 0) return player.notify(`misc:WHY_GO_THERE`);

        // If the player is not on the correct stage, don't let them through.
        if (this.stage < door.stage) return player.notify(`misc:DONT_THINK_GO_IN`);

        // Handle door requiring an item to proceed (and remove the item from the player's inventory).
        if (door.reqItem) {
            let count = door.reqItemCount || 1;

            if (!player.inventory.hasItem(door.reqItem, count))
                return player.notify('misc:NO_KEY_DOOR');

            player.inventory.removeItem(door.reqItem, count);

            player.notify(`misc:DOOR_KEY_CRUMBLES`);
        }

        // Let the super class handle the rest.
        super.handleDoor(door, player);
    }
}
