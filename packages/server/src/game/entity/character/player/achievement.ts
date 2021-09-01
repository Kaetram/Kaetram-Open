import { Modules, Opcodes } from '@kaetram/common/network';

import Data from '../../../../../data/achievements.json';
import Messages from '../../../../network/messages';

import type { AchievementData } from '@kaetram/common/types/info';
import type NPC from '../../npc/npc';
import type Player from './player';

export default class Achievement {
    public progress = 0;

    public data: Partial<{
        item: number;
        itemCount: number;
        isDoorReward: boolean;
        reward: number | string;
        name: string;
        description: string;
        count: number;
        text: string[];
        type: number;
        npc: number;
        mob: number;
        rewardType: number;
    }>;

    public name;
    public description;

    public discovered = false;

    public constructor(public id: number, private player: Player) {
        this.data = Data[this.id.toString() as keyof typeof Data];

        if (!this.data.reward) this.data.reward = 'door';

        this.name = this.data.name!;
        this.description = this.data.description!;
    }

    public step(): void {
        if (this.isThreshold()) return;

        this.progress++;

        this.update();

        this.player.send(
            new Messages.Quest(Opcodes.Quest.Progress, {
                id: this.id,
                name: this.name,
                progress: this.progress,
                count: this.data.count,
                isQuest: false
            })
        );
    }

    public converse(npc: NPC): void {
        if (this.isThreshold() || this.hasItem()) this.finish(npc);
        else {
            this.player.send(
                new Messages.NPC(Opcodes.NPC.Talk, {
                    id: npc.instance,
                    text: npc.talk(this.data.text!, this.player)
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

    public finish(npc?: NPC): void {
        let { rewardType, item, itemCount, reward } = this.data;

        switch (rewardType) {
            case Modules.Achievements.Rewards.Item:
                if (!this.player.inventory.hasSpace()) {
                    this.player.notify(
                        'You do not have enough space in your inventory to finish this achievement.'
                    );
                    return;
                }

                this.player.inventory.add({
                    id: item,
                    count: itemCount
                });

                break;

            case Modules.Achievements.Rewards.Experience:
                this.player.addExperience(reward as number);

                break;
        }

        this.setProgress(9999);
        this.update();

        this.player.send(
            new Messages.Quest(Opcodes.Quest.Finish, {
                id: this.id,
                name: this.name,
                isQuest: false
            })
        );

        this.player.popup('Achievement Completed!', `You have completed ${this.name}!`, '#33cc33');

        if (npc && this.player.npcTalkCallback) this.player.npcTalkCallback(npc);
    }

    private update(): void {
        this.player.save();
    }

    private isThreshold(): boolean {
        return this.progress >= this.data.count!;
    }

    private hasItem(): boolean {
        if (
            this.data.type === Modules.Achievements.Type.Scavenge &&
            this.player.inventory.contains(this.data.item!)
        ) {
            this.player.inventory.remove(this.data.item!, this.data.itemCount!);

            return true;
        }

        return false;
    }

    public setProgress(progress: number, skipRegion = false): void {
        this.progress = progress;

        if (this.data.isDoorReward && !skipRegion) this.player.updateRegion();
    }

    public isStarted(): boolean {
        return this.progress > 0;
    }

    public isFinished(): boolean {
        return this.progress > 9998;
    }

    public getInfo(): AchievementData {
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
