/* global module */

let Quest = require('../quest'),
    Packets = require('../../../../../../network/packets'),
    Messages = require('../../../../../../network/messages');

class Introduction extends Quest {

    constructor(player, data) {
        super(player, data);

        let self = this;

        self.player = player;
        self.data = data;

        self.lastNPC = null;
    }

    load(stage) {
        let self = this;

        if (!self.player.inTutorial()) {
            self.setStage(9999);
            self.update();
            return;
        }

        super.load(stage);

        self.updatePointers();
        self.toggleChat();

        if (self.stage > 9998)
            return;

        self.loadCallbacks();
    }

    loadCallbacks() {
        let self = this;

        self.onNPCTalk((npc) => {

            let conversation = self.getConversation(npc.id);

            self.lastNPC = npc;

            self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(conversation, self.player)
            }));

            if (self.player.talkIndex === 0)
                self.progress('talk');

        });

        self.player.onReady(() => {

            self.updatePointers();

        });

        self.player.onDoor((destX, destY) => {
            if (self.getTask() !== 'door') {
                self.player.notify('You cannot go through this door yet.');
                return;
            }

            if (!self.verifyDoor(self.player.x, self.player.y))
                self.player.notify('You are not supposed to go through here.');
            else {
                self.progress('door');
                self.player.teleport(destX, destY, false);
            }
        });

        self.player.onInventory((isOpen) => {

            if (isOpen && self.stage === 1)
                self.progress('click');

        });

        self.player.onProfile((isOpen) => {

            if (isOpen && self.stage === 3)
                self.progress('click');

        });

        self.player.onWarp((isOpen) => {

            if (isOpen && self.stage === 5)
                self.progress('click');

        });

        self.player.onKill((character) => {
            if (self.data.kill[self.stage] === character.id)
                self.progress('kill');

        });

    }

    progress(type) {
        let self = this,
            task = self.data.task[self.stage];

        if (!task || task !== type)
            return;

        if (self.stage === self.data.stages) {
            self.finish();
            return;
        }

        switch (type) {

            case 'door':

                if (self.stage === 7)
                    self.player.inventory.add({
                        id: 248,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });

                else if (self.stage === 15)
                    self.player.inventory.add({
                        id: 87,
                        count: 1,
                        ability: -1,
                        abilityLevel: -1
                    });

                break;


        }

        self.stage++;

        self.clearPointers();
        self.resetTalkIndex();

        self.update();
        self.updatePointers();

        self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
            id: self.id,
            stage: self.stage,
            isQuest: true
        }));

        if (self.getTask() === 'door')
            self.player.updateRegion();
    }

    isFinished() {
        return super.isFinished() || !this.player.inTutorial();
    }

    toggleChat() {
        this.player.canTalk = !this.player.canTalk;
    }

    setStage(stage) {
        let self = this;

        super.setStage(stage);

        self.clearPointers();
    }

    finish() {
        let self = this;

        self.toggleChat();
        super.finish();
    }

    hasDoorUnlocked(door) {
        let self = this;

        switch (door.id) {
            case 0:
                return self.stage > 6;

            case 6:
                return self.stage > 14;

            case 7:
                return self.stage > 22;
        }

        return false;
    }

    verifyDoor(destX, destY) {
        let self = this,
            doorData = self.data.doors[self.stage];

        if (!doorData)
            return;

        return doorData[0] === destX && doorData[1] === destY;
    }

    getSpawn() {
        let self = this;

        if (self.stage > 7)
            return { x: 331, y: 12 };

        return { x: 375, y: 41 };
    }

    onFinishedLoading(callback) {
        this.finishedCallback = callback;
    }
}

module.exports = Introduction;
