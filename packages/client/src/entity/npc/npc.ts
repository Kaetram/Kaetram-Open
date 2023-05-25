import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

export default class NPC extends Entity {
    public constructor(instance: string) {
        super(instance, Modules.EntityType.NPC);
    }

    /**
     * Sets the idling state for the NPC.
     */

    public override idle(): void {
        this.setAnimation('idle_down', this.sprite.idleSpeed);
    }
}
