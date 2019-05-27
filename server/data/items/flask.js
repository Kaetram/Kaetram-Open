/* global module */

let Item = require('../../js/game/entity/objects/item.js'),
    Utils = require('../../js/util/utils'),
    Items = require('../../js/util/items');

class Flask extends Item {

    constructor(id, instance, x, y) {
        super(id, instance, x, y);

        let self = this;

        self.healAmount = 0;
        self.manaAmount = 0;

        let customData = Items.getCustomData(id);

        if (customData) {
            self.healAmount = customData.healAmount ? customData.healAmount : 0;
            self.manaAmount = customData.manaAmount ? customData.manaAmount : 0;
        }
    }

    onUse(character) {
        let self = this;

        if (self.healAmount)
            character.healHitPoints(self.healAmount);

        if (self.manaAmount)
            character.healManaPoints(self.manaAmount);

    }

}

module.exports = Flask;