/* global module */

import Quest from '../quest';
import Player from '../../player';
import NPC from '../../../../npc/npc';
import Character from '../../../character';
import Packets from '../../../../../../network/packets';
import Messages from '../../../../../../network/messages';

class Introduction extends Quest {
    lastNPC: NPC;
    finishedCallback: Function;

    constructor(player: Player, data: any) {
        super(player, data);

        this.player = player;
        this.data = data;

        this.lastNPC = null;
    }

    load(stage: number) {
        if (!this.player.inTutorial()) {
            this.setStage(9999);
            this.update();
            return;
        }

        super.load(stage);

        this.updatePointers();
        this.toggleChat();

        if (this.stage > 9998) return;

        this.loadCallbacks();
    }

    loadCallbacks() {
        this.onNPCTalk((npc: NPC) => {
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

        this.player.onReady(() => {
            this.updatePointers();
        });

        this.player.onDoor((destX: number, destY: number) => {
            if (this.getTask() !== 'door') {
                this.player.notify('You cannot go through this door yet.');
                return;
            }

            if (!this.verifyDoor(this.player.x, this.player.y))
                this.player.notify('You are not supposed to go through here.');
            else {
                this.progress('door');
                this.player.teleport(destX, destY, false);
            }
        });

        this.player.onInventory((isOpen: boolean) => {
            if (isOpen && this.stage === 1) this.progress('click');
        });

        this.player.onProfile((isOpen: boolean) => {
            if (isOpen && this.stage === 3) this.progress('click');
        });

        this.player.onWarp((isOpen: boolean) => {
            if (isOpen && this.stage === 5) this.progress('click');
        });

        this.player.onKill((character: Character) => {
            if (this.data.kill[this.stage] === character.id) this.progress('kill');
        });
    }

    progress(type: string) {
        let task = this.data.task[this.stage];

        if (!task || task !== type) return;

        if (this.stage === this.data.stages) {
            this.finish();
            return;
        }

        switch (type) {
            case 'door':
                if (this.stage === 7)
                    this.player.inventory.add({
                        id: 248,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });
                else if (this.stage === 15)
                    this.player.inventory.add({
                        id: 87,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });

                break;
        }

        this.stage++;

        this.clearPointers();
        this.resetTalkIndex();

        this.update();
        this.updatePointers();

        this.player.send(
            new Messages.Quest(Packets.QuestOpcode.Progress, {
                id: this.id,
                stage: this.stage,
                isQuest: true
            })
        );

        if (this.getTask() === 'door') this.player.updateRegion();
    }

    isFinished() {
        return super.isFinished() || !this.player.inTutorial();
    }

    toggleChat() {
        this.player.canTalk = !this.player.canTalk;
    }

    setStage(stage: number) {
        super.setStage(stage);

        this.clearPointers();
    }

    finish() {
        this.toggleChat();
        super.finish();
    }

    hasDoorUnlocked(door: any) {
        switch (door.id) {
            case 0:
                return this.stage > 6;

            case 6:
                return this.stage > 14;

            case 7:
                return this.stage > 22;
        }

        return false;
    }

    verifyDoor(destX: number, destY: number) {
        let doorData = this.data.doors[this.stage];

        if (!doorData) return;

        return doorData[0] === destX && doorData[1] === destY;
    }

    getSpawn() {
        if (this.stage > 7) return { x: 331, y: 12 };

        return { x: 375, y: 41 };
    }

    onFinishedLoading(callback: Function) {
        this.finishedCallback = callback;
    }
}

export default Introduction;
