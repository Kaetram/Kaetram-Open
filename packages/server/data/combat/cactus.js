let Combat = require('../../js/game/entity/character/combat/combat'),
    Hit = require('../../js/game/entity/character/combat/hit'),
    Modules = require('../../js/util/modules');

class Cactus extends Combat {

    constructor(character) {
        character.spawnDistance = 10;
        character.alwaysAggressive = true;

        super(character);

        let self = this;

        self.character = character;

        self.character.onDamaged((damage, attacker) => {
            if (!attacker || !attacker.armour || attacker.isRanged())
                return;

            self.damageAttacker(damage, attacker);

            log.debug(`Entity ${self.character.id} damaged ${damage} by ${attacker.instance}.`);
        });

        self.character.onDeath(() => {
            self.forEachAttacker((attacker) => {

                self.damageAttacker(self.character.maxHitPoints, attacker);
            });

            log.debug('Oh noes, le cactus did a die. :(');
        });
    }

    damageAttacker(damage, attacker) {
        let self = this;

        if (!attacker || !attacker.armour || attacker.isRanged())
            return;

        /**
         * This is the formula for dealing damage when a player
         * attacks the cactus. Eventually the damage will cancel out
         * as the armour gets better.
         **/

        let defense = attacker.armour.getDefense(),
            calculatedDamage = Math.floor((damage / 2) - (defense * 5));

        if (calculatedDamage < 1)
            return;

        let hitInfo = new Hit(Modules.Hits.Damage, calculatedDamage).getData();

        self.hit(self.character, attacker, hitInfo, true);
    }

}

module.exports = Cactus;
