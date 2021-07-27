import Player from '../character/player/player';
import Entity from '../entity';

export default class NPC extends Entity {
    talkIndex: number;

    constructor(id: number, instance: string, x: number, y: number) {
        super(id, 'npc', instance, x, y);

        this.talkIndex = 0;
    }

    talk(messages?: string[], player?: Player): string {
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
