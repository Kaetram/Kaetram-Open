let Modules = require('../../../../../../util/modules'),
    Formulas = require('../../../../../../util/formulas'),
    Constants = require('../../../../../../util/constants'),
    Messages = require('../../../../../../network/messages'),
    Packets = require('../../../../../../network/packets');

class Profession {

    constructor(id, player, name) {
        let self = this;

        self.id = id;
        self.player = player;
        self.name = name; // The profession name

        self.world = player.world;

        self.map = self.world.map;
        self.region = self.world.region;

        self.experience = 0;
        self.nextExperience = Formulas.nextExp(self.experience);
        self.prevExperience = Formulas.prevExp(self.experience);

        self.level = Formulas.expToLevel(self.experience);

        self.targetId = null;
    }

    load(data) {
        this.experience = data.experience;
    }

    addExperience(experience) {
        var self = this;

        self.experience += experience;

        let oldLevel = self.level;

        self.level = Formulas.expToLevel(self.experience);
        self.nextExperience = Formulas.nextExp(self.experience);
        self.prevExperience = Formulas.prevExp(self.experience);

        if (oldLevel !== self.level)
            self.player.popup('Profession Level Up!', `Congratulations, your ${self.name} level is now ${self.level}.`, '#9933ff');

        self.player.send(new Messages.Experience(Packets.ExperienceOpcode.Profession, {
            id: self.player.instance,
            amount: experience
        }));

        self.player.send(new Messages.Profession(Packets.ProfessionOpcode.Update, {
            id: self.id,
            level: self.level,
            percentage: self.getPercentage()
        }));

        self.player.save();
    }

    stop() {
        return 'Not implemented.';
    }

    getLevel() {
        let self = this,
            level = Formulas.expToLevel(self.experience);

        if (level > Constants.MAX_PROFESSION_LEVEL)
            level = Constants.MAX_PROFESSION_LEVEL;

        return level;
    }

    sync() {
        let self = this;

        self.player.sendToAdjacentRegions(self.player.region, new Messages.Sync({
            id: self.player.instance,
            orientation: self.getOrientation()
        }))
    }

    isTarget() {
        return this.player.target === this.targetId;
    }

    getPercentage() {
        let self = this,
            experience = self.experience - self.prevExperience,
            nextExperience = self.nextExperience - self.prevExperience;

        return (experience / nextExperience * 100).toFixed(2);
    }

    getOrientation() {
        let self = this;

        if (!self.targetId)
            return Modules.Orientation.Up;

        let position = self.map.idToPosition(self.targetId);

        if (position.x > self.player.x)
            return Modules.Orientation.Right;
        else if (position.x < self.player.x)
            return Modules.Orientation.Left;
        else if (position.y > self.player.y)
            return Modules.Orientation.Down;
        else (position.y < self.player.y)
            return Modules.Orientation.Up;

        return Modules.Orientation.Up;
    }

    getData() {
        return {
            experience: this.experience
        }
    }
}

module.exports = Profession;
