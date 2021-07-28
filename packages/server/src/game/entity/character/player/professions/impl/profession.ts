import Map from '../../../../../../map/map';
import Messages from '../../../../../../network/messages';
import Packets from '@kaetram/common/src/packets';
import Region from '../../../../../../region/region';
import Constants from '../../../../../../util/constants';
import Formulas from '../../../../../../util/formulas';
import * as Modules from '@kaetram/common/src/modules';
import World from '../../../../../world';
import Player from '../../player';

export default abstract class Profession {
    public id: number;
    public player: Player;
    public name: string;

    public world: World;

    public map: Map;
    public region: Region;

    public experience: number;

    public targetId: string | null; // Double Check

    public level!: number;

    public nextExperience?: number;
    public prevExperience!: number;

    constructor(id: number, player: Player, name: string) {
        this.id = id;
        this.player = player;
        this.name = name; // The profession name

        this.world = player.world;

        this.map = this.world.map;
        this.region = this.world.region;

        this.experience = 0;

        this.targetId = null;
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
            new Messages.Experience(Packets.ExperienceOpcode.Profession, {
                id: this.player.instance,
                amount: experience
            })
        );

        this.player.send(
            new Messages.Profession(Packets.ProfessionOpcode.Update, {
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
