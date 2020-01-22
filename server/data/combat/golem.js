let Combat = require('../../js/game/entity/character/combat/combat'),
    Hit = require('../../js/game/entity/character/combat/hit'),
    Modules = require('../../js/util/modules');

class Golem extends Combat {

    /**
     * This mob behaves as both as a mini-boss, and a normal entity.
     * Its status updates in accordance to whether the `.miniboss`
     * variable is set to true in its character status.
     */

    constructor(character) {
        super(character);

        let self = this;

        self.character = character;

        // Just skip this for now, we will think of an ability later.
        if (!self.character.miniboss)
            return;

        

    }

}

module.exports = Golem;
