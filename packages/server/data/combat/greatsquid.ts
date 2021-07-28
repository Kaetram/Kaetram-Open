import * as Modules from '@kaetram/common/src/modules';

import Character from '../../src/game/entity/character/character';
import Combat from '../../src/game/entity/character/combat/combat';

import type { HitData } from '../../src/game/entity/character/combat/hit';

export default class GreatSquid extends Combat {
    lastTerror: number;

    constructor(character: Character) {
        character.spawnDistance = 15;
        super(character);

        this.character = character;

        this.lastTerror = Date.now();
    }

    override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.canUseTerror()) {
            hitInfo.type = Modules.Hits.Stun;

            this.lastTerror = Date.now();
        }

        super.hit(character, target, hitInfo);
    }

    canUseTerror(): boolean {
        return Date.now() - this.lastTerror > 15000;
    }
}
