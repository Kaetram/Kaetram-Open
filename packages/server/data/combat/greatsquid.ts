import Combat from '../../ts/game/entity/character/combat/combat';
import Modules from '../../ts/util/modules';

class GreatSquid extends Combat {

    lastTerror: number;

    constructor(character) {
        character.spawnDistance = 15;
        super(character);

        let self = this;

        self.character = character;

        self.lastTerror = new Date().getTime();
    }

    hit(character, target, hitInfo) {
        let self = this;

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
