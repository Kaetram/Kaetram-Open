import { Modules, Opcodes } from '@kaetram/common/network';

import Messages from '../../../../../../network/messages';
import Constants from '../../../../../../util/constants';
import Formulas from '../../../../../../util/formulas';

import type Player from '../../player';

export default abstract class Profession {
    protected tick = 1000;

    public world;

    public map;
    public region;

    public experience = 0;

    public targetId: string | null = null; // Double Check

    public level!: number;

    public nextExperience: number | undefined;
    public prevExperience!: number;

    protected constructor(public id: number, public player: Player, public name: string) {
        this.world = player.world;

        this.map = this.world.map;
        this.region = this.world.region;
    }

    load(data: { experience: number }): void {
        this.experience = data.experience;

        this.level = Formulas.expToLevel(this.experience);

        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);
    }

    addExperience(experience: number): void {
        this.experience += experience;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);

        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level)
            this.player.popup(
                'Profession Level Up!',
                `Congratulations, your ${this.name} level is now ${this.level}.`,
                '#9933ff'
            );

        this.player.send(
            new Messages.Experience(Opcodes.Experience.Profession, {
                id: this.player.instance,
                amount: experience
            })
        );

        this.player.send(
            new Messages.Profession(Opcodes.Profession.Update, {
                id: this.id,
                level: this.level,
                percentage: this.getPercentage()
            })
        );

        this.player.save();
    }

    stop(): void {
        //
    }

    getLevel(): number {
        let level = Formulas.expToLevel(this.experience);

        if (level > Constants.MAX_PROFESSION_LEVEL) level = Constants.MAX_PROFESSION_LEVEL;

        return level;
    }

    sync(): void {
        this.player.sendToAdjacentRegions(
            this.player.region,
            new Messages.Sync({
                id: this.player.instance,
                orientation: this.getOrientation()
            })
        );
    }

    isTarget(): boolean {
        return this.player.target!.instance === this.targetId;
    }

    getPercentage(): string {
        let experience = this.experience - this.prevExperience,
            nextExperience = this.nextExperience! - this.prevExperience;

        return ((experience / nextExperience) * 100).toFixed(2);
    }

    getOrientation(): Modules.Orientation {
        if (!this.targetId) return Modules.Orientation.Up;

        let position = this.map.idToPosition(this.targetId);

        if (position.x > this.player.x) return Modules.Orientation.Right;
        else if (position.x < this.player.x) return Modules.Orientation.Left;
        else if (position.y > this.player.y) return Modules.Orientation.Down;
        position.y < this.player.y;
        return Modules.Orientation.Up;
    }

    getData(): { experience: number } {
        return {
            experience: this.experience
        };
    }
}
