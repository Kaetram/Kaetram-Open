import { Opcodes } from '@kaetram/common/network';
import { Bubble } from '@kaetram/server/src/network/packets';

import type Player from '../../entity/character/player/player';

export default class Sign {
    public instance = ''; // Instance in this case are the object's coordinates.

    public constructor(public x: number, public y: number, public text: string[]) {
        this.instance = `${x}-${y}`;
    }

    /**
     * Similarly to `talk()` in `npc.ts` except that it sends a packet
     * indicating that the bubble be generated to a specific coordinate.
     * @param player The player interacting with the object.
     */

    public talk(player: Player): void {
        // No text provided for the object.
        if (this.text.length === 0) return;

        // Reset the player's talk index and NPC to the current object's instance.
        if (player.npcTalk !== this.instance) player.resetTalk(this.instance);

        // Current index in the text array.
        let message = this.text[player.talkIndex];

        /**
         * Reset the talking index when we reach the end or
         * continue progression otherwise.
         */

        if (player.talkIndex > this.text.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        // Send bubble packet to the player.
        player.send(
            new Bubble(
                {
                    x: this.x,
                    y: this.y,
                    text: message
                },
                Opcodes.Bubble.Position
            )
        );
    }
}
