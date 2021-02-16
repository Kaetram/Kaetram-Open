import Entity from '../entity';

export default class Item extends Entity {
    dropped: boolean;
    count: number;
    ability: number;
    abilityLevel: number;
    stackable: boolean;

    constructor(id: string, type: string, count: number, ability: number, abilityLevel: number) {
        super(id, type);

        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.dropped = false;
        this.stackable = false;

        this.type = 'item';
    }

    idle(): void {
        this.setAnimation('idle', 150);
    }

    hasShadow(): boolean {
        return true;
    }
}
