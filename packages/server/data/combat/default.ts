import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';

/*
 * The default superclass for combat-related plugins.
 * It just shorteness the amount of work that needs to be done
 * when adding special entities.
 */

class Default extends Combat {
    constructor(character: Character) {
        super(character);

        const self = this;

        self.character = character;
    }
}

export default Default;
