import { Modules } from '@kaetram/common/network';
import Entity from '../entity';

export default class Item extends Entity {
    public dropped = false;

    public constructor(
        instance: string,
        public count: number,
        public ability: number,
        public abilityLevel: number
    ) {
        super(instance, Modules.EntityType.Item);
    }

    public override idle(): void {
        this.setAnimation('idle', 150);
    }

    public override hasShadow(): boolean {
        return true;
    }
}
