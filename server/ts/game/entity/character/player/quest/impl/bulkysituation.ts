import Quest from '../quest';
import Packets from '../../../../../../network/packets';
import Messages from '../../../../../../network/messages';
import Player from '../../player';

/**
 *
 */
class BulkySituation extends Quest {
    public getTask: any;

    public player: Player;

    public getItem: any;

    public stage: any;

    public onNPCTalk: any;

    public getConversation: any;

    public lastNPC: any;

    public data: any;

    public resetTalkIndex: any;

    public id: any;

    public update: any;

    constructor(player, data) {
        super(player, data);

        this.player = player;
        this.data = data;

        this.lastNPC = null;
    }

    load(stage) {
        super.load(stage);

        if (this.stage > 9998) return;

        this.loadCallbacks();
    }

    loadCallbacks() {
        this.onNPCTalk((npc) => {
            if (this.hasRequirement()) {
                this.progress('item');

                return;
            }

            const conversation = this.getConversation(npc.id);

            this.lastNPC = npc;

            this.player.send(
                new Messages.NPC(Packets.NPCOpcode.Talk, {
                    id: npc.instance,
                    text: npc.talk(conversation, this.player)
                })
            );

            if (npc.talkIndex === 0) this.progress('talk');
        });
    }

    progress(type) {
        const task = this.data.task[this.stage];

        if (!task || task !== type) return;

        if (this.stage === this.data.stages) {
            this.finish();

            return;
        }

        switch (type) {
            case 'item':
                this.player.inventory.remove(this.getItem(), 1);

                break;
        }

        this.resetTalkIndex(this.lastNPC);

        this.stage++;

        this.player.send(
            new Messages.Quest(Packets.QuestOpcode.Progress, {
                id: this.id,
                stage: this.stage,
                isQuest: true
            })
        );

        this.update();
    }

    finish() {
        super.finish();
    }

    hasRequirement() {
        return (
            this.getTask() === 'item' &&
            this.player.inventory.contains(this.getItem())
        );
    }
}

export default BulkySituation;
