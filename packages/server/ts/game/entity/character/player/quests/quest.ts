/* global module */

import Messages from '../../../../../network/messages';
    import Packets from '../../../../../network/packets';
    import Utils from '../../../../../util/utils';
    import _ from 'underscore';

class Quest {

    constructor(player, data) {
        this.player = player;
        this.data = data;

        this.id = data.id;
        this.name = data.name;
        this.description = data.description;

        this.stage = 0;
    }

    load(stage) {
        if (!stage)
            this.update();
        else
            this.stage = parseInt(stage);
    }

    finish() {
        let item = this.getItemReward();

        if (item) {
            if (this.hasInventorySpace(item.id, item.count))
                this.player.inventory.add({
                    id: item.id,
                    count: item.count,
                    ability: -1,
                    abilityLevel: -1
                });
            else {
                this.player.notify('You do not have enough space in your inventory.');
                this.player.notify('Please make room prior to finishing the quest.');

                return;
            }
        }

        this.setStage(9999);

        this.player.send(new Messages.Quest(Packets.QuestOpcode.Finish, {
            id: this.id,
            isQuest: true
        }));

        this.update();
    }

    setStage(stage) {
        this.stage = stage;
        this.update();
    }

    triggerTalk(npc) {
        if (this.npcTalkCallback)
            this.npcTalkCallback(npc);
    }

    update() {
        return this.player.save();
    }

    getConversation(id) {
        let conversation = this.data.conversations[id];

        if (!conversation || !conversation[this.stage])
            return [''];

        return conversation[this.stage];
    }

    updatePointers() {
        if (!this.data.pointers)
            return;

        let pointer = this.data.pointers[this.stage];

        if (!pointer)
            return;

        let opcode = pointer[0];

        if (opcode === 4)
            this.player.send(new Messages.Pointer(opcode, {
                id: Utils.generateRandomId(),
                button: pointer[1]
            }));
        else
            this.player.send(new Messages.Pointer(opcode, {
                id: Utils.generateRandomId(),
                x: pointer[1],
                y: pointer[2]
            }));

    }

    forceTalk(npc, message) {
        if (!npc)
            return;

        this.player.talkIndex = 0;

        this.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
            id: npc.instance,
            text: message
        }));
    }

    resetTalkIndex() {
        /**
         * Resets the player's talk index for the next dialogue to take place.
         */

        this.player.talkIndex = 0;
    }

    clearPointers() {
        this.player.send(new Messages.Pointer(Packets.PointerOpcode.Remove, {}))
    }

    onNPCTalk(callback) {
        this.npcTalkCallback = callback;
    }

    hasMob(mob) {
        if (!this.data.mobs)
            return;

        return this.data.mobs.indexOf(mob.id) > -1;
    }

    hasNPC(id) {
        return this.data.npcs.indexOf(id) > -1;
    }

    hasItemReward() {
        return !!this.data.itemReward;
    }

    hasInventorySpace(id, count) {
        return this.player.inventory.canHold(id, count);
    }

    hasDoorUnlocked(door) {
        return this.stage > 9998;
    }

    isFinished() {
        return this.stage > 9998;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getTask() {
        return this.data.task[this.stage];
    }

    getItem() {
        return this.data.itemReq ? this.data.itemReq[this.stage] : null;
    }

    getStage() {
        return this.stage;
    }

    getItemReward() {
        return this.hasItemReward() ? this.data.itemReward : null;
    }

    getDescription() {
        return this.description;
    }

    getInfo() {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            stage: this.getStage(),
            finished: this.isFinished()
        };
    }

}

export default Quest;
