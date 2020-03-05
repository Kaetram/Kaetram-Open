import Entity from '../entity';

class NPC extends Entity {
    public talkIndex: any;
    public id: any;

    constructor(id, instance, x, y) {
        super(id, 'npc', instance, x, y);

        this.talkIndex = 0;
    }

    talk(messages, player) {
        if (!player) return;

        if (player.npcTalk !== this.id) {
            player.talkIndex = 0;
            player.npcTalk = this.id;
        }

        const message = messages[player.talkIndex];

        if (player.talkIndex > messages.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        return message;
    }
}

export default NPC;
