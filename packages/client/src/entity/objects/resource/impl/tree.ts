import Resource from '../resource';

import { Modules } from '@kaetram/common/network';

import type { Frame } from '../../../animation';
import type Sprite from '../../../sprite';

export default class Tree extends Resource {
    public baseFrame!: Frame;
    public exhaustedFrame!: Frame;

    public constructor(instance: string) {
        super(instance, Modules.EntityType.Tree);
    }

    /**
     * Override for the set sprite that computes the base frame and the stump frame.
     * @param sprite The sprite that we are setting.
     */

    public override setSprite(sprite: Sprite): void {
        super.setSprite(sprite);

        this.baseFrame = this.sprite.animations.exhausted.frame;
        this.exhaustedFrame = this.sprite.animations.exhausted.getSecondFrame();
    }
}
