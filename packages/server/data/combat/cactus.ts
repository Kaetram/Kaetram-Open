import * as Modules from '@kaetram/common/src/modules';

import Combat from '../../src/game/entity/character/combat/combat';
import Hit from '../../src/game/entity/character/combat/hit';
import log from '../../src/util/log';

import type Character from '../../src/game/entity/character/character';
import type Player from '../../src/game/entity/character/player/player';

export default class Cactus extends Combat {
    constructor(character: Character) {
        character.spawnDistance = 10;
        character.alwaysAggressive = true;

        super(character);

        this.character = character;

        this.character.onDamaged((damage, attacker) => {
            const player = attacker as Player;

            if (!player || !player.armour || player.isRanged()) return;

            this.damageAttacker(damage, player);

            log.debug(`Entity ${this.character.id} damaged ${damage} by ${attacker.instance}.`);
        });

        this.character.onDeath(() => {
            this.forEachAttacker((attacker) => {
                this.damageAttacker(this.character.maxHitPoints, attacker as Player);
            });

            log.debug('Oh noes, le cactus did a die. :(');
        });
    }

    damageAttacker(damage: number, attacker: Player): void {
        if (!attacker || !attacker.armour || attacker.isRanged()) return;

        /**
         * This is the formula for dealing damage when a player
         * attacks the cactus. Eventually the damage will cancel out
         * as the armour gets better.
         **/

        const defense = attacker.armour.getDefense(),
            calculatedDamage = Math.floor(damage / 2 - defense * 5);

        if (calculatedDamage < 1) return;

        const hitInfo = new Hit(Modules.Hits.Damage, calculatedDamage).getData();

        this.hit(this.character, attacker, hitInfo, true);
    }
}
