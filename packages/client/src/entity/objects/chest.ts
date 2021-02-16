import Entity from '../entity';

export default class Chest extends Entity {
    constructor(id: string, type: string) {
        super(id, type);

        this.type = 'chest';
    }

    idle(): void {
        this.setAnimation('idle_down', 150);
    }
}
