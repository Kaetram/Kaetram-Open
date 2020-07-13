import Messages from '../../../../network/messages';
import Packets from '../../../../network/packets';
import Modules from '../../../../util/modules';
import Player from './player';
import NPC from '../../npc/npc';

import * as Data from '../../../../../data/achievements.json';

class Achievement {
    public id: number;
    public player: Player;

    public progress: number;

    public data: any;

    public name: string;
    public description: string;

    public discovered: boolean;

    constructor(id: number, player: Player) {
        this.id = id;
        this.player = player;

        this.progress = 0;

        this.data = Data[this.id];

        if (!this.data.reward)
            this.data.reward = 'door';

        this.name = this.data.name;
        this.description = this.data.description;

        this.discovered = false;
    }

    step() {
        if (this.isThreshold()) return;

        this.progress++;

        this.update();

        this.player.send(
            new Messages.Quest(Packets.QuestOpcode.Progress, {
                id: this.id,
                name: this.name,
                progress: this.progress,
                count: this.data.count,
                isQuest: false
            })
        );
    }

    converse(npc: NPC) {
        if (this.isThreshold() || this.hasItem()) this.finish(npc);
        else {
            this.player.send(
                new Messages.NPC(Packets.NPCOpcode.Talk, {
                    id: npc.instance,
                    text: npc.talk(this.data.text, this.player)
                })
            );

            if (!this.isStarted() && this.player.talkIndex === 0) {
                this.player.popup(
                    'Achievement Discovered!',
                    `You have discovered ${this.name} achievement.`,
                    '#33cc33'
                );
                this.step();
            }
        }
    }

    finish(npc: NPC) {
        let rewardType = this.data.rewardType;

        switch (rewardType) {
            case Modules.Achievements.Rewards.Item:
                if (!this.player.inventory.hasSpace()) {
                    this.player.notify(
                        'You do not have enough space in your inventory to finish this achievement.'
                    );
                    return;
                }

                this.player.inventory.add({
                    id: this.data.item,
                    count: this.data.itemCount
                });

                break;

            case Modules.Achievements.Rewards.Experience:
                this.player.addExperience(this.data.reward);

                break;
        }

        this.setProgress(9999);
        this.update();

        this.player.send(
            new Messages.Quest(Packets.QuestOpcode.Finish, {
                id: this.id,
                name: this.name,
                isQuest: false
            })
        );

        this.player.popup('Achievement Completed!', `You have completed ${this.name}!`, '#33cc33');

        if (npc && this.player.npcTalkCallback) this.player.npcTalkCallback(npc);
    }

    update() {
        this.player.save();
    }

    isThreshold() {
        return this.progress >= this.data.count;
    }

    hasItem() {
        if (
            this.data.type === Modules.Achievements.Type.Scavenge &&
            this.player.inventory.contains(this.data.item)
        ) {
            this.player.inventory.remove(this.data.item, this.data.itemCount);

            return true;
        }

        return false;
    }

    setProgress(progress: number, skipRegion?: boolean) {
        this.progress = progress;

        if (this.data.isDoorReward && !skipRegion) this.player.updateRegion();
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
        };
    }
}

export default Achievement;
