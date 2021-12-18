import { Modules } from '@kaetram/common/network';

import Character from '../../src/game/entity/character/character';
import Combat from '../../src/game/entity/character/combat/combat';

import type { HitData } from '@kaetram/common/types/info';

export default class GreatSquid extends Combat {
    private lastTerror: number;

    public constructor(character: Character) {
        character.spawnDistance = 15;
        super(character);

        this.character = character;

        this.lastTerror = Date.now();
    }

    public override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.canUseTerror()) {
            hitInfo.type = Modules.Hits.Stun;

            this.lastTerror = Date.now();
        }

        super.hit(character, target, hitInfo);
    }

    private canUseTerror(): boolean {
        return Date.now() - this.lastTerror > 15_000;
    }
}
