import Entity from '../entity';

import type Player from '../character/player/player';

import rawData from '../../../../data/npcs.json';
import { NPC as NPCPacket } from '../../../network/packets';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';
import { NPCData } from '@kaetram/common/types/npc';

type RawData = {
    [key: string]: NPCData;
};

export default class NPC extends Entity {
    // talkIndex = 0;

    private data: NPCData;

    private text: string[] = [];

    public role?: string;
    public store = '';

    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.NPC), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[NPC] Could not find data for ${key}.`);
            return;
        }

        // Load default NPC data.
        this.name = this.data.name!;
        this.text = this.data.text || this.text;
        this.role = this.data.role!;
        this.store = this.data.store || '';
    }

    /**
     * Talks to an NPC and progresses the talking index of the player. It returns
     * the message the NPC is currently saying.
     * @param player The player to grab/compare talk index of.
     * @param text Optional parameter that uses default text in `npcs.json` if not specified.
     * @returns String of the current massage.
     */

    public talk(player?: Player, text = this.text): void {
        if (!(player && this.hasDialogue(text))) return;

        // Reset the talking index if we talk to a new NPC.
        if (player.npcTalk !== this.key) {
            player.talkIndex = 0;
            player.npcTalk = this.key;
        }

        // Text to display at the current talking index.
        let message = text[player.talkIndex];

        /**
         * Reset the talking index when we reach the end or
         * continue progression otherwise.
         */

        if (player.talkIndex > text.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        // Send the network packet of the current dialogue index.
        player.send(
            new NPCPacket(Opcodes.NPC.Talk, {
                id: this.instance,
                text: message
            })
        );
    }

    /**
     * Checks if the NPC has a dialogue array.
     * @returns If the dialogue array length is greater than 0.
     */

    public hasDialogue(text: string[]): boolean {
        return text.length > 0;
    }
}
