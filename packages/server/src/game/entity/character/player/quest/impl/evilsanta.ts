import Quest from '../quest';

import log from '@kaetram/common/util/log';

import type Player from '../../player';
import type { ProcessedDoor } from '@kaetram/common/types/map';
import type { RawQuest } from '@kaetram/common/types/quest';

export default class EvilSanta extends Quest {
    public constructor(key: string, rawData: RawQuest) {
        super(key, rawData);
    }

    protected override handleDoor(door: ProcessedDoor, player: Player): void {
        log.debug(`[${this.name}] Door: ${door.x}-${door.y} - stage: ${this.stage}.`);

        if (this.stage === 0) return player.notify(`Now hang on, why would I wanna go in there?`);

        // If the player is not on the correct stage, don't let them through.
        if (this.stage < door.stage)
            return player.notify(`I don't think I should go in there just yet...`);

        // Handle door requiring an item to proceed (and remove the item from the player's inventory).
        if (door.reqItem) {
            let count = door.reqItemCount || 1;

            if (!player.inventory.hasItem(door.reqItem, count))
                return player.notify('You do not have the required key to pass through this door.');

            player.inventory.removeItem(door.reqItem, count);

            player.notify(`The key crumbles to dust as you pass through the door.`);
        }

        // Let the super class handle the rest.
        super.handleDoor(door, player);
    }
}
