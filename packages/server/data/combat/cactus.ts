import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Combat from '../../src/game/entity/character/combat/combat';
import Hit from '../../src/game/entity/character/combat/hit';

import type Character from '../../src/game/entity/character/character';
import type Player from '../../src/game/entity/character/player/player';

export default class Cactus extends Combat {
    public constructor(character: Character) {
        character.spawnDistance = 10;
        character.alwaysAggressive = true;

        super(character);

        this.character = character;

        this.character.onDamaged((damage, attacker) => {
            let player = attacker as Player;

            if (!player || !player.armour || player.isRanged()) return;

            this.damageAttacker(damage, player);

            log.debug(`Entity ${this.character.id} damaged ${damage} by ${player.instance}.`);
        });

        this.character.onDeath(() => {
            this.forEachAttacker((attacker) => {
                this.damageAttacker(this.character.maxHitPoints, attacker as Player);
            });

            log.debug('Oh noes, le cactus did a die. :(');
        });
    }

    private damageAttacker(damage: number, attacker: Player): void {
        if (!attacker || !attacker.armour || attacker.isRanged()) return;

        let defense = attacker.armour.getDefense(),
            /**
             * This is the formula for dealing damage when a player
             * attacks the cactus. Eventually the damage will cancel out
             * as the armour gets better.
             */
            calculatedDamage = Math.floor(damage / 2 - defense * 5);

        if (calculatedDamage < 1) return;

        let hitInfo = new Hit(Modules.Hits.Damage, calculatedDamage).getData();

        this.hit(this.character, attacker, hitInfo, true);
    }
}
