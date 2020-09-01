import Entity from '../entity';

export default class Chest extends Entity {
    constructor(id: string, kind: number) {
        super(id, kind);

        this.type = 'chest';
    }

    idle(): void {
        this.setAnimation('idle_down', 150);
    }
}
