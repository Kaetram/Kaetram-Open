import Entity from '../../entity';

import type { Modules } from '@kaetram/common/network';

export default abstract class Resource extends Entity {
    public exhausted = false;

    public constructor(instance: string, type: Modules.EntityType) {
        super(instance, type);
    }

    /**
     * Plays the shake animation for the resource.
     */

    public shake(): void {
        this.setAnimation('shake', 150, 1, () => {
            this.idle();
        });
    }

    /**
     * Override for the animation frame to use for the tree.
     */

    public override idle(): void {
        this.setAnimation(this.exhausted ? 'exhausted' : 'idle', 150, 1, () => {
            //
        });
    }

    /**
     * Override for the `updateSilhouette` function to bypass drawing any silhouette
     * around the resource if it is exhausted.
     * @param state The state of the silhouette.
     */

    public override updateSilhouette(state?: boolean): void {
        if (this.exhausted) {
            this.silhouette = false;
            return;
        }

        super.updateSilhouette(state);
    }

    /**
     * Used for a resource to alternate between an exhausted state (just the empty
     * resource) or its default idle state.
     * @param state The new state of the resource.
     */

    public setExhausted(state = false): void {
        this.exhausted = state;

        this.idle();
    }
}
