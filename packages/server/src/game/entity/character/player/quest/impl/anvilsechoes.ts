import Quest from '../quest';
import Data from '../../../../../../../data/quests/anvilsechoes.json';

import type { ProcessedDoor } from '@kaetram/common/types/map';
import type Player from '../../player';

export default class AnvilsEchoes extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }

    /**
     * Override for when the player goes through the door. We want to trigger an NPC
     * dialogue when the player attempts to go through the door but hasn't finished
     * the quest yet.
     * @param door The door the player is going through.
     * @param player The player going through the door.
     */

    protected override handleDoor(door: ProcessedDoor, player: Player): void {
        if (this.stage < door.stage) {
            let npc = player.world.entities.getNPCByKey(door.npc);

            npc?.talk(player, [`Hey, don't go in there, it's dangerous!`]);

            return;
        }

        super.handleDoor(door, player);
    }
}
