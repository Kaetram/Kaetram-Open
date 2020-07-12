/* global module */

import Player from '../../ts/game/entity/character/player/player';
import Items from '../../ts/util/items';

class HealthFlask {
    id: number;
    healAmount: number;
    manaAmount: number;

    constructor(id: number) {
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

    onUse(character: Player) {
        let self = this;

        if (self.healAmount) character.healHitPoints(self.healAmount);

        if (self.manaAmount) character.healManaPoints(self.manaAmount);
    }
}

export default HealthFlask;
