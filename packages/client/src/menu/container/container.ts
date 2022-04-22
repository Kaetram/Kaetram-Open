import { SlotData } from '@kaetram/common/types/slot';
import Slot from './slot';

export default class Container {
    public slots: Slot[] = [];

    /**
     * Since we're dealing with containers such as inventory, we create
     * a container item with the same size as the inventory or whatever
     * container we're dealing with.
     * @param size The size of the initial container.
     */

    public constructor(public size = 0) {
        for (let i = 0; i < this.size; i++) this.slots.push(new Slot(i));
    }

    /**
     * Finds an item in the container based on its key.
     * @param key The key to look for.
     * @returns Slot if found or undefined otherwise.
     */

    public get(key: string): Slot | undefined {
        return this.slots.find((slot) => slot.key === key);
    }

    /**
     * Sometimes we may need to use the container differently. Such as in the
     * case of stores, we add items to the container whenever needed instead
     * of creating predefined container sizes.
     * @param info Information about the slot we're addding. See `SlotData` object.
     */

    public add(info: SlotData): void {
        let slot = new Slot(info.index);

        slot.load(
            info.key,
            info.count,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable,
            info.name,
            info.price
        );

        this.slots.push(slot);
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
            info.name,
            info.price
        );
    }
}
