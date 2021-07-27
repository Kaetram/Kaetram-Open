import Messages from '../../../../../../network/messages';
import Packets from '@kaetram/common/src/packets';
import NPC from '../../../../npc/npc';
import Player from '../../player';
import Quest from '../quest';
import { QuestData } from '../quest';

export default class BulkySituation extends Quest {
    lastNPC: NPC;

    constructor(player: Player, data: QuestData) {
        super(player, data);

        this.player = player;
        this.data = data;

        this.lastNPC = null;
    }

    load(stage: number): void {
        super.load(stage);

        if (this.stage > 9998) return;

        this.loadCallbacks();
    }

    loadCallbacks(): void {
        this.onNPCTalk((npc: NPC) => {
            if (this.hasRequirement()) {
                this.progress('item');
                return;
            }

            let conversation = this.getConversation(npc.id);

            this.lastNPC = npc;

            this.player.send(
                new Messages.NPC(Packets.NPCOpcode.Talk, {
                    id: npc.instance,
                    text: npc.talk(conversation, this.player)
                })
            );

            if (this.player.talkIndex === 0) this.progress('talk');
        });
    }

    progress(type: string): void {
        let task = this.data.task[this.stage];

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

        this.resetTalkIndex();

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

    finish(): void {
        super.finish();
    }

    hasRequirement(): boolean {
        return this.getTask() === 'item' && this.player.inventory.contains(this.getItem());
    }
}
