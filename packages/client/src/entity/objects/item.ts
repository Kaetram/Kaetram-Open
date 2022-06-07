import { Modules } from '@kaetram/common/network';
import Entity from '../entity';

export default class Item extends Entity {
    public dropped = false;

    public constructor(
        instance: string,
        public count: number = 1,
        public ability: number = -1,
        public abilityLevel: number = -1
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
