import { Opcodes } from '@kaetram/common/network';

import Messages from '../../../../../../network/messages';
import Quest from '../quest';

import type NPC from '../../../../npc/npc';

export default class BulkySituation extends Quest {
    private lastNPC: NPC | null = null;

    public override load(stage: number): void {
        super.load(stage);

        if (this.stage > 9998) return;

        this.loadCallbacks();
    }

    private loadCallbacks(): void {
        this.onNPCTalk((npc: NPC) => {
            if (this.hasRequirement()) {
                this.progress('item');
                return;
            }

            let conversation = this.getConversation(npc.id);

            this.lastNPC = npc;

            this.player.send(
                new Messages.NPC(Opcodes.NPC.Talk, {
                    id: npc.instance,
                    text: npc.talk(conversation, this.player)
                })
            );

            if (this.player.talkIndex === 0) this.progress('talk');
        });
    }

    private progress(type: string): void {
        let task = this.data.task![this.stage];

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
            new Messages.Quest(Opcodes.Quest.Progress, {
                id: this.id,
                stage: this.stage,
                isQuest: true
            })
        );

        this.update();
    }

    // override finish(): void {
    //     super.finish();
    // }

    private hasRequirement(): boolean {
        return this.getTask() === 'item' && this.player.inventory.contains(this.getItem());
    }
}
