import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

export default class Tree extends Entity {
    public cut = false;

    public constructor(instance: string) {
        super(instance, Modules.EntityType.Tree);
    }

    public override idle(): void {
        this.setAnimation(this.cut ? 'stump' : 'idle', 150, 1, () => {
            //
        });
    }
}
