import Entity from '../entity';

export default class Chest extends Entity {
    constructor(id, kind) {
        super(id, kind);

        this.type = 'chest';
    }

    idle() {
        this.setAnimation('idle_down', 150);
    }
}
