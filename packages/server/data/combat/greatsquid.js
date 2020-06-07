let Combat = require('../../js/game/entity/character/combat/combat'),
    Modules = require('../../js/util/modules');

class GreatSquid extends Combat {

    constructor(character) {
        character.spawnDistance = 15;
        super(character);

        let self = this;

        self.character = character;

        self.lastTerror = new Date().getTime();
    }

    hit(character, target, hitInfo) {
        let self = this;

        if (self.canUseTerror) {
            hitInfo.type = Modules.Hits.Stun;

            self.lastTerror = new Date().getTime();
        }

        super.hit(character, target, hitInfo);
    }

    canUseTerror() {
        return new Date().getTime() - this.lastTerror > 15000;
    }

}

module.exports = GreatSquid;
