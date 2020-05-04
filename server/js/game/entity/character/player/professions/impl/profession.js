let Modules = require('../../../../../../util/modules'),
    Formulas = require('../../../../../../util/formulas');

class Profession {

    constructor(id, player) {
        let self = this;

        self.id = id;
        self.player = player;

        self.world = player.world;

        self.map = self.world.map;
        self.region = self.world.region;

        self.experience = 0;
    }

    load(data) {
        this.experience = data.experience;
    }

    getLevel() {
        return Formulas.expToLevel(this.experience);
    }

    getData() {
        return {
            experience: this.experience
        }
    }
}

module.exports = Profession;
