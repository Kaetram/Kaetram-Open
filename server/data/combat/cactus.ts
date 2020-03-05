import Combat from '../../ts/game/entity/character/combat/combat';
import Hit from '../../ts/game/entity/character/combat/hit';
import Modules from '../../ts/util/modules';

class Cactus extends Combat {
    public hit: any;
    public character: any;

    constructor(character) {
        character.spawnDistance = 10;
        character.alwaysAggressive = true;

        super(character);

        this.character = character;

        this.character.onDamaged((damage, attacker) => {
            if (!attacker || !attacker.armour || attacker.isRanged()) return;

            this.damageAttacker(damage, attacker);

            console.debug(
                `Entity ${this.character.id} damaged ${damage} by ${attacker.instance}.`
            );
        });

        this.character.onDeath(() => {
            this.forEachAttacker(attacker => {
                this.damageAttacker(this.character.maxHitPoints, attacker);
            });

            console.debug('Oh noes, le cactus did a die. :(');
        });
    }

    damageAttacker(damage, attacker) {
        if (!attacker || !attacker.armour || attacker.isRanged()) return;

        /**
         * This is the formula for dealing damage when a player
         * attacks the cactus. Eventually the damage will cancel out
         * as the armour gets better.
         **/

        const defense = attacker.armour.getDefense();
        const calculatedDamage = Math.floor(damage / 2 - defense * 5);

        if (calculatedDamage < 1) return;

        const hitInfo = new Hit(
            Modules.Hits.Damage,
            calculatedDamage
        ).getData();

        this.hit(this.character, attacker, hitInfo, true);
    }
}

export default Cactus;
