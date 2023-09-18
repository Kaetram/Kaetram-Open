import Entity from '../../entity';

import { Modules } from '@kaetram/common/network';

import type { EntityData } from '@kaetram/common/types/entity';
import type { ResourceEntityData } from '@kaetram/common/types/resource';

export default abstract class Resource extends Entity {
    // Amount of time it takes for the resource to respawn.
    protected respawnTime: number = Modules.Constants.RESOURCE_RESPAWN;

    // The state of the resource
    public state: Modules.ResourceState = Modules.ResourceState.Default;

    // Callbacks for when the resource state changes.
    private respawnTimeout?: NodeJS.Timeout | undefined;
    private stateCallback?: () => void;

    public constructor(instance: string, key: string, x: number, y: number) {
        super(instance, key, x, y);
    }

    /**
     * Depletes a resource by updating its state. We create a respawn
     * timeout that respawns the resource and updates the nearby
     * region when the timeout expires.
     */

    public deplete(): void {
        // Cannot cut a tree that's already cut.
        if (this.respawnTimeout) return;

        this.setState(Modules.ResourceState.Depleted);

        // Reset the tree once the timeout expires.
        this.respawnTimeout = setTimeout(() => {
            this.setState(Modules.ResourceState.Default);

            this.respawnTimeout = undefined;
        }, this.respawnTime);
    }

    /**
     * Default implementation for respawn time. Each subsequent entity that extends
     * this class will override the respawn time with their own implementation.
     * @returns Default respawn time for this resource abstract.
     */

    public getRespawnTime(): number {
        return this.respawnTime;
    }

    /**
     * Checks whether the resource is depleted or not.
     * @returns If the current state is that of a depleted resource state.
     */

    public isDepleted(): boolean {
        return this.state === Modules.ResourceState.Depleted;
    }

    /**
     * Updates the state of the resource and creates a callback.
     * @param state The new state of the resource.
     */

    private setState(state: Modules.ResourceState): void {
        this.state = state;

        this.stateCallback?.();
    }

    /**
     * Updates the respawn time of the resource.
     * @param time New time (in milliseconds) for the resource to respawn.
     */

    public setRespawnTime(time = this.getRespawnTime()): void {
        this.respawnTime = time;
    }

    /**
     * Override for the entity serialization to also include the state
     * of the resource currently.
     * @returns A serialized version of the resource to be rendered on the client side.
     */

    public override serialize(): ResourceEntityData {
        let data = super.serialize() as ResourceEntityData;

        data.state = this.state;

        return data;
    }

    /**
     * Callback for when a resource undergoes a state change.
     */

    public onStateChange(callback: () => void): void {
        this.stateCallback = callback;
    }
}
