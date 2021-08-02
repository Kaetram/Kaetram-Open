import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';

export default class Snek extends Combat {
    public constructor(character: Character) {
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

    private canPoison(): boolean {
        let chance = Utils.randomInt(0, this.character.level);

        return chance === 7;
    }

    private getPoisonData(): string {
        return `${Date.now().toString()}:30000:1`;
    }
}
