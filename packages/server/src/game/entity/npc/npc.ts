import Entity from '../entity';

import type Player from '../character/player/player';

export default class NPC extends Entity {
    // talkIndex = 0;

    public constructor(id: number, instance: string, x: number, y: number) {
        super(id, 'npc', instance, x, y);
    }

    public talk(messages: string[], player?: Player): string | undefined {
        if (!player) return;

        if (player.npcTalk !== this.id) {
            player.talkIndex = 0;
            player.npcTalk = this.id;
        }

        let message = messages[player.talkIndex];

        if (player.talkIndex > messages.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        return message;
    }
}
