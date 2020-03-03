import Combat from '../../ts/game/entity/character/combat/combat';
import Modules from '../../ts/util/modules';

class GreatSquid extends Combat {
	public lastTerror: any;

	constructor(character) {
	    character.spawnDistance = 15;
	    super(character);

	    

	    this.character = character;

	    this.lastTerror = new Date().getTime();
	}

	hit(character, target, hitInfo) {
	    

	    if (this.canUseTerror) {
	        hitInfo.type = Modules.Hits.Stun;

	        this.lastTerror = new Date().getTime();
	    }

	    super.hit(character, target, hitInfo);
	}

	canUseTerror() {
	    return new Date().getTime() - this.lastTerror > 15000;
	}

}

export default GreatSquid;
