import Entity from '../entity';

import type Player from '../character/player/player';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import { NPCData } from '@kaetram/common/types/npc';

import rawData from '../../../../data/npcs.json';
import log from '@kaetram/common/util/log';

type RawData = {
    [key: string]: NPCData;
};

export default class NPC extends Entity {
    // talkIndex = 0;

    private data: NPCData;

    private text: string[] = [];
    private role?: string;

    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.NPC), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`Could not find data for ${key}.`);
            return;
        }

        this.text = this.data.text || this.text;
        this.role = this.data.role!;
    }

    public talk(messages: string[], player?: Player): string | undefined {
        if (!player) return;

        if (player.npcTalk !== this.key) {
            player.talkIndex = 0;
            player.npcTalk = this.key;
        }

        let message = messages[player.talkIndex];

        if (player.talkIndex > messages.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        return message;
    }
}
