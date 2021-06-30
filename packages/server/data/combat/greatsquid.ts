import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Modules from '../../src/util/modules';

class GreatSquid extends Combat {
    lastTerror: number;

    constructor(character: Mob) {
        character.spawnDistance = 15;
        super(character);

        this.character = character;

        this.lastTerror = Date.now();
    }

    hit(character: Character, target: Character, hitInfo: any) {
        if (this.canUseTerror) {
            hitInfo.type = Modules.Hits.Stun;

            this.lastTerror = Date.now();
        }

        super.hit(character, target, hitInfo);
    }

    canUseTerror() {
        return Date.now() - this.lastTerror > 15000;
    }
}

export default GreatSquid;
