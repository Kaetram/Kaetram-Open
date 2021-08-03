import Combat from '../../src/game/entity/character/combat/combat';

import type Character from '../../src/game/entity/character/character';

/**
 * The default superclass for combat-related plugins.
 * It just shortens the amount of work that needs to be done
 * when adding special entities.
 */
export default class Default extends Combat {
    public constructor(character: Character) {
        super(character);

        this.character = character;
    }
}
