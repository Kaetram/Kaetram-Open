import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

export default class Chest extends Entity {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.Chest);
    }

    public override idle(): void {
        this.setAnimation('idle_down', 150);
    }
}
