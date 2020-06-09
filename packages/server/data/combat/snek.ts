import Combat from '../../ts/game/entity/character/combat/combat';
import Hit from '../../ts/game/entity/character/combat/hit';
import Utils from '../../ts/util/utils';
import Modules from '../../ts/util/modules';

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

export default Snek;
