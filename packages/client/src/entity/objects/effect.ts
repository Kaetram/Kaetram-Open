import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

export default class Effect extends Entity {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.Effect);
    }

    public override idle(): void {
        this.setAnimation(
            'idle',
            150,
            1,
            () => {
                //
            },
            true
        );
    }
}
