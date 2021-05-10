import Entity from '../entity';

export default class Item extends Entity {
    public type = 'item';

    public dropped = false;

    public constructor(
        id: string,
        kind: string,
        public count: number,
        public ability: number,
        public abilityLevel: number
    ) {
        super(id, kind);
    }

    public idle(): void {
        this.setAnimation('idle', 150);
    }

    public hasShadow(): boolean {
        return true;
    }
}
