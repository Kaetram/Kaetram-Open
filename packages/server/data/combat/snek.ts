import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Utils from '../../src/util/utils';
import log from '../../src/util/log';

class Snek extends Combat {
    constructor(character: Mob) {
        character.spawnDistance = 15;
        super(character);

        const self = this;

        self.character = character;

        self.character.onDamage((target: Character, hitInfo: any) => {
            if (!target || target.type !== 'player') return;

            if (self.canPoison()) target.setPoison(self.getPoisonData());

            log.info(
                `Entity ${self.character.id} hit ${target.instance} - damage ${hitInfo.damage}.`
            );
        });
    }

    canPoison() {
        const self = this,
            chance = Utils.randomInt(0, self.character.level);

        return chance === 7;
    }

    getPoisonData() {
        return new Date().getTime().toString() + ':30000:1';
    }
}

export default Snek;
