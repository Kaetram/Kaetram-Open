import { Modules } from '@kaetram/common/network';
import Entity from '../entity';

export default class Item extends Entity {
    public override type = Modules.EntityType.Item;

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

    public override idle(): void {
        this.setAnimation('idle', 150);
    }

    public override hasShadow(): boolean {
        return true;
    }
}
