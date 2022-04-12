import { SlotData } from '@kaetram/common/types/slot';
import Slot from './slot';

export default class Container {
    public slots: Slot[] = [];

    public constructor(public size = 0) {
        for (let i = 0; i < this.size; i++) this.slots.push(new Slot(i));
    }

    /**
     * We receive information from the server here, so we mustn't do any calculations.
     * Instead, we just modify the container directly.
     */

    public update(index: number, info: SlotData): void {
        this.slots[index].load(
            info.key,
            info.count,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable,
            info.name!
        );
    }

    public getImageFormat(name: string | null): string {
        let image = `/img/sprites/item-${name}.png`;

        return `url("${image}")`;
    }
}
