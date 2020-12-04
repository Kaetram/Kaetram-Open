import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Modules from '../../src/util/modules';

class GreatSquid extends Combat {
    lastTerror: number;

    constructor(character: Mob) {
        character.spawnDistance = 15;
        super(character);

        const self = this;

        self.character = character;

        self.lastTerror = new Date().getTime();
    }

    hit(character: Character, target: Character, hitInfo: any) {
        const self = this;

        if (self.canUseTerror) {
            hitInfo.type = Modules.Hits.Stun;

            self.lastTerror = new Date().getTime();
        }

        super.hit(character, target, hitInfo);
    }

    canUseTerror() {
        return new Date().getTime() - this.lastTerror > 15000;
    }
}

export default GreatSquid;
