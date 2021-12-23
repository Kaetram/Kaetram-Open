import Entity from '../entity';

import type Player from '../character/player/player';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import NPCs from '@kaetram/server/src/info/npcs';

export default class NPC extends Entity {
    // talkIndex = 0;

    public constructor(private key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.NPC), x, y);
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
