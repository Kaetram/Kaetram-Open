import Entity from '../entity';

import type Player from '../character/player/player';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';

import { NPCData } from '@kaetram/common/types/npc';

import { NPC as NPCPacket } from '../../../network/packets';

import rawData from '../../../../data/npcs.json';
import log from '@kaetram/common/util/log';

type RawData = {
    [key: string]: NPCData;
};

export default class NPC extends Entity {
    // talkIndex = 0;

    private data: NPCData;

    private text: string[] = [];
    public role?: string;

    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.NPC), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[NPC] Could not find data for ${key}.`);
            return;
        }

        this.name = this.data.name!;
        this.text = this.data.text || this.text;
        this.role = this.data.role!;
    }

    /**
     * Talks to an NPC and progresses the talking index of the player. It returns
     * the message the NPC is currently saying.
     * @param player The player to grab/compare talk index of.
     * @param text Optional parameter that uses default text in `npcs.json` if not specified.
     * @returns String of the current massage.
     */

    public talk(player?: Player, text = this.text): void {
        if (!(player && this.hasDialogue())) return;

        // Reset the talking index if we talk to a new NPC.
        if (player.npcTalk !== this.key) {
            player.talkIndex = 0;
            player.npcTalk = this.key;
        }

        let message = text[player.talkIndex];

        if (player.talkIndex > text.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

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

    public hasDialogue(): boolean {
        return this.text.length > 0;
    }
}
