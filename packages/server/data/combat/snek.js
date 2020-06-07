let Combat = require('../../js/game/entity/character/combat/combat'),
    Hit = require('../../js/game/entity/character/combat/hit'),
    Utils = require('../../js/util/utils'),
    Modules = require('../../js/util/modules');

class Snek extends Combat {

    constructor(character) {
        character.spawnDistance = 15;
        super(character);

        let self = this;

        self.character = character;

        self.character.onDamage((target, hitInfo) => {
            if (!target || target.type !== 'player')
                return;

            if (self.canPoison())
                target.setPoison(self.getPoisonData());

            log.info(`Entity ${self.character.id} hit ${target.instance} - damage ${hitInfo.damage}.`);
        });

    }

    canPoison() {
        let self = this,
            chance = Utils.randomInt(0, self.character.level);

        return chance === 7;
    }

    getPoisonData() {
        return new Date().getTime().toString() + ':30000:1';
    }

}

module.exports = Snek;
