import Entity from '../entity';

export default class Item extends Entity {
    count: any;
    ability: any;
    abilityLevel: any;
    dropped: boolean;
    stackable: boolean;

    constructor(id, kind, count, ability, abilityLevel) {
        super(id, kind);

        this.count = count;
        this.ability = ability;
        this.abilityLevel = abilityLevel;

        this.dropped = false;
        this.stackable = false;

        this.type = 'item';
    }

    idle() {
        this.setAnimation('idle', 150);
    }

    hasShadow() {
        return true;
    }
}
