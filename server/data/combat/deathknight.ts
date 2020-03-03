import Combat from '../../ts/game/entity/character/combat/combat';
import Hit from '../../ts/game/entity/character/combat/hit';
import Modules from '../../ts/util/modules';

class Golem extends Combat {
	public updated: any;
	public character: any;
	achievementId: number;

	/**
     * This mob behaves as both as a mini-boss, and a normal entity.
     * Its status updates in accordance to whether the `.miniboss`
     * variable is set to true in its character status.
     */

	constructor(character) {
	    super(character);

	    

	    this.character = character;

	    this.achievementId = 5; // Achievement we are finishing.

	    // Start processing after we initialize the mob in this case.
	    this.character.onLoad(() => {

	        if (this.character.miniboss)
	            this.updateData(28, 230, 6, 20);

	    });

	    this.character.onDeath(() => {

	        this.forEachAttacker((attacker) => {
	            attacker.finishAchievement(9);
	        });

	    });

	}

	updateData(level, hitPoints, weaponLevel, armourLevel) {
	    

	    /* We only update the mob data once to prevent any issues. */

	    if (this.updated)
	        return;

	    this.character.level = level;
	    this.character.hitPoints = hitPoints;
	    this.character.maxHitPoints = hitPoints;
	    this.character.weaponLevel = weaponLevel;
	    this.character.armourLevel = armourLevel;

	    this.updated = true;
	}


}

export default Golem;
