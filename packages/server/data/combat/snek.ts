import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Utils from '../../src/util/utils';
import log from '../../src/util/log';
import { HitData } from '@kaetram/server/src/game/entity/character/combat/hit';

export default class Snek extends Combat {
    constructor(character: Character) {
        character.spawnDistance = 15;
        super(character);

        this.character = character;

        this.character.onDamage((target: Character, hitInfo: HitData) => {
            if (!target || target.type !== 'player') return;

            if (this.canPoison()) target.setPoison(this.getPoisonData());

            log.info(
                `Entity ${this.character.id} hit ${target.instance} - damage ${hitInfo.damage}.`
            );
        });
    }

    canPoison(): boolean {
        const chance = Utils.randomInt(0, this.character.level);

        return chance === 7;
    }

    getPoisonData(): string {
        return Date.now().toString() + ':30000:1';
    }
}
