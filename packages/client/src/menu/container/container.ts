import Slot from './slot';

export default class Container {
    public slots: Slot[] = [];

    public constructor(public size: number) {
        for (let i = 0; i < this.size; i++) this.slots.push(new Slot(i));
    }

    /**
     * We receive information from the server here, so we mustn't do any calculations.
     * Instead, we just modify the container directly.
     */
    public setSlot(index: number, info: Partial<Slot>): void {
        this.slots[index].load(
            info.string!,
            info.count!,
            info.ability,
            info.abilityLevel,
            info.edible,
            info.equippable
        );
    }

    // getEmptySlot(): number {
    //     for (let i = 0; i < this.slots.length; i++) if (!this.slots[i].string) return i;

    //     return -1;
    // }

    public getImageFormat(name: string | null): string {
        let image = `/img/sprites/item-${name}.png`;

        return `url("${image}")`;
    }
}
