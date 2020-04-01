/* global module */

let Data = require('../../../../../data/achievements'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets'),
    Modules = require('../../../../util/modules');

class Achievement {

    constructor(id, player) {
        let self = this;

        self.id = id;
        self.player = player;

        self.progress = 0;

        self.data = Data[self.id];

        self.name = self.data.name;
        self.description = self.data.description;

        self.discovered = false;
    }

    step() {
        let self = this;

        if (self.isThreshold())
            return;

        self.progress++;

        self.update();

        self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
            id: self.id,
            name: self.name,
            progress: self.progress,
            count: self.data.count,
            isQuest: false
        }));
    }

    converse(npc) {
        let self = this;

        if (self.isThreshold() || self.hasItem())
            self.finish(npc);
        else {

            self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(self.data.text, self.player)
            }));

            if (!self.isStarted() && self.player.talkIndex === 0)
                self.step();
        }
    }

    finish(npc) {
        let self = this,
            rewardType = self.data.rewardType;

        switch (rewardType) {
            case Modules.Achievements.Rewards.Item:

                if (!self.player.inventory.hasSpace()) {
                    self.player.notify('You do not have enough space in your inventory to finish this achievement.');
                    return;
                }

                self.player.inventory.add({
                    id: self.data.item,
                    count: self.data.itemCount
                });

                break;

            case Modules.Achievements.Rewards.Experience:

                self.player.addExperience(self.data.reward);

                break;
        }

        self.setProgress(9999);
        self.update();

        self.player.send(new Messages.Quest(Packets.QuestOpcode.Finish, {
            id: self.id,
            name: self.name,
            isQuest: false
        }));

        if (npc && self.player.npcTalkCallback)
            self.player.npcTalkCallback(npc);
    }

    update() {
        this.player.save();
    }

    isThreshold() {
        return this.progress >= this.data.count;
    }

    hasItem() {
        let self = this;

        if (self.data.type === Modules.Achievements.Type.Scavenge && self.player.inventory.contains(self.data.item)) {
            self.player.inventory.remove(self.data.item, self.data.itemCount);

            return true;
        }

        return false
    }

    setProgress(progress, skipRegion) {
        let self = this;

        self.progress = parseInt(progress);

        if (self.data.rewardType === 'door' && !skipRegion)
            self.player.updateRegion();
    }

    isStarted() {
        return this.progress > 0;
    }

    isFinished() {
        return this.progress > 9998;
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.data.type,
            description: this.description,
            count: this.data.count || 1,
            progress: this.progress,
            finished: this.isFinished()
        }
    }

}

module.exports = Achievement;
