import { Modules } from '@kaetram/common/network';
import Entity from '../entity';

export default class Chest extends Entity {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.Chest);
    }

    public override idle(): void {
        this.setAnimation('idle_down', 150);
    }
}
