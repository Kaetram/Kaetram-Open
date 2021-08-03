import Items from '../../../../../util/items';
import { Modules } from '@kaetram/common/network';
import Equipment from './equipment';

export default class Armour extends Equipment {
    public defense;

    public constructor(
        name: string,
        id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        super(name, id, count, ability, abilityLevel);

        this.defense = Items.getArmourLevel(name);
    }

    private hasAntiStun(): boolean {
        return this.ability === 6;
    }

    private setDefense(defense: number): void {
        this.defense = defense;
    }

    public getDefense(): number {
        return this.defense;
    }

    protected getType(): Modules.Equipment {
        return Modules.Equipment.Armour;
    }
}
