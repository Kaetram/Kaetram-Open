import Modules from '../../../../../../util/modules';
import Formulas from '../../../../../../util/formulas';
import Constants from '../../../../../../util/constants';
import Messages from '../../../../../../network/messages';
import Packets from '../../../../../../network/packets';
import Player from '../../player';
import World from '../../../../../world';
import Map from '../../../../../../map/map';
import Region from '../../../../../../region/region';

class Profession {

    public id: number;
    public player: Player;
    public name: string;

    public world: World;

    public map: Map;
    public region: Region;

    public experience: number;

    public targetId: string; // Double Check

    public level: number;

    public nextExperience: number;
    public prevExperience: number;

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

    load(data: any) {

        this.experience = data.experience;

        this.level = Formulas.expToLevel(this.experience);

        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);
    }

    addExperience(experience: number) {
        this.experience += experience;

        let oldLevel = this.level;

        this.level = Formulas.expToLevel(this.experience);

        this.nextExperience = Formulas.nextExp(this.experience);
        this.prevExperience = Formulas.prevExp(this.experience);

        if (oldLevel !== this.level)
            this.player.popup('Profession Level Up!', `Congratulations, your ${this.name} level is now ${this.level}.`, '#9933ff');

        this.player.send(new Messages.Experience(Packets.ExperienceOpcode.Profession, {
            id: this.player.instance,
            amount: experience
        }));

        this.player.send(new Messages.Profession(Packets.ProfessionOpcode.Update, {
            id: this.id,
            level: this.level,
            percentage: this.getPercentage()
        }));

        this.player.save();
    }

    stop(): any {
        return 'Not implemented.';
    }

    getLevel() {
        let level = Formulas.expToLevel(this.experience);

        if (level > Constants.MAX_PROFESSION_LEVEL)
            level = Constants.MAX_PROFESSION_LEVEL;

        return level;
    }

    sync() {

        this.player.sendToAdjacentRegions(this.player.region, new Messages.Sync({
            id: this.player.instance,
            orientation: this.getOrientation()
        }))
    }

    isTarget() {
        return this.player.target === this.targetId;
    }

    getPercentage() {
        let experience = this.experience - this.prevExperience,
            nextExperience = this.nextExperience - this.prevExperience;

        return (experience / nextExperience * 100).toFixed(2);
    }

    getOrientation() {

        if (!this.targetId)
            return Modules.Orientation.Up;

        let position = this.map.idToPosition(this.targetId);

        if (position.x > this.player.x)
            return Modules.Orientation.Right;
        else if (position.x < this.player.x)
            return Modules.Orientation.Left;
        else if (position.y > this.player.y)
            return Modules.Orientation.Down;
        else (position.y < this.player.y)
            return Modules.Orientation.Up;
    }

    getData() {
        return {
            experience: this.experience
        }
    }
}

export default Profession;
