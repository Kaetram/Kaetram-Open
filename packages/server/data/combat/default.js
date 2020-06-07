let Combat = require('../../js/game/entity/character/combat/combat');

/*
 * The default superclass for combat-related plugins.
 * It just shorteness the amount of work that needs to be done
 * when adding special entities.
 */

class Default extends Combat {

    constructor(character) {
        super(character);

        let self = this;

        self.character = character;

    }

}
