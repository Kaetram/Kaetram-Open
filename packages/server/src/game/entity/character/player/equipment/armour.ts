import Items from '../../../../../util/items';
import * as Modules from '@kaetram/common/src/modules';
import Equipment from './equipment';

export default class Armour extends Equipment {
    public defense: number;

    constructor(name: string, id: number, count: number, ability: number, abilityLevel: number) {
        super(name, id, count, ability, abilityLevel);

        this.defense = Items.getArmourLevel(name);
    }

    hasAntiStun(): boolean {
        return this.ability === 6;
    }

    setDefense(defense: number): void {
        this.defense = defense;
    }

    getDefense(): number {
        return this.defense;
    }

    getType(): Modules.Equipment {
        return Modules.Equipment.Armour;
    }
}
