/* global module */

import Items from '../../ts/util/items';
    import Utils from '../../ts/util/utils';

class HealthFlask {

    id: number;
    healAmount: number;
    manaAmount: number;

    constructor(id) {
        let self = this;

        self.id = id;

        self.healAmount = 0;
        self.manaAmount = 0;

        let customData = Items.getCustomData(self.id);

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

export default HealthFlask;
