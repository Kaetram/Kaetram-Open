import Entity from '../entity';

export default class Item extends Entity {
    constructor(id, kind, count, ability, abilityLevel) {
        super(id, kind);

        var self = this;

        self.count = count;
        self.ability = ability;
        self.abilityLevel = abilityLevel;

        self.dropped = false;
        self.stackable = false;

        self.type = 'item';
    }

    idle() {
        this.setAnimation('idle', 150);
    }

    hasShadow() {
        return true;
    }
}
