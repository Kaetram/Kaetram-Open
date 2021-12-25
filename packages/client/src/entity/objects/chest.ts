import { Modules } from '@kaetram/common/network';
import Entity from '../entity';

export default class Chest extends Entity {
    public override readonly type = Modules.EntityType.Chest;

    public constructor(id: string, kind: string) {
        super(id, kind);
    }

    public override idle(): void {
        this.setAnimation('idle_down', 150);
    }
}
