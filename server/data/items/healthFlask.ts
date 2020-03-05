import Items from '../../ts/util/items';
import Utils from '../../ts/util/utils';

class HealthFlask {
    public healAmount: any;
    public manaAmount: any;
    id: any;

    constructor(id) {
        this.id = id;

        this.healAmount = 0;
        this.manaAmount = 0;

        const customData = Items.getCustomData(this.id);

        if (customData) {
            this.healAmount = customData.healAmount ? customData.healAmount : 0;
            this.manaAmount = customData.manaAmount ? customData.manaAmount : 0;
        }
    }

    onUse(character) {
        if (this.healAmount) character.healHitPoints(this.healAmount);

        if (this.manaAmount) character.healManaPoints(this.manaAmount);
    }
}

export default HealthFlask;
