import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type { ProcessedResource, RegionTile } from '@kaetram/common/types/map';

export default class Resource {
    public instance = Utils.createInstance(Modules.EntityType.Object);

    // Amount of time it takes for the resource to respawn.
    protected respawnTime: number = Modules.Constants.RESOURCE_RESPAWN;

    // Data contains original tile data from the map
    public data: { [index: number]: RegionTile } = {};

    // Tile data containing information after the resource has been depleted.
    private depleted: { [index: number]: RegionTile } = {};

    // The state of the resource
    public state: Modules.ResourceState = Modules.ResourceState.Default;

    private respawnTimeout?: NodeJS.Timeout | undefined;
    private stateCallback?: () => void;

    public constructor(public type: string) {}

    /**
     * Takes information from the `info` parameter and determines
     * if a tile is either a base or just resource data. If it's resource data,
     * we remove the resource information. If it's a base, we replace the
     * base with the tileId of the depleted resource. We store this data for later.
     * A base is an interactable resource tile that the player can click on.
     * @param info The resource information based on the resource's type.
     */

    public load(info: ProcessedResource): void {
        // Iterate through all the tile and its indexes in the resource.
        for (let key in this.data) {
            let index = parseInt(key),
                flatTile = [this.data[key]].flat();

            // Why would you put a resource in the void? How are you even near the resource?
            if (!Array.isArray(flatTile))
                return log.warning(`[${index}] Could not parse tile data for tree.`);

            // Find if the tile contains data or base data.
            let dataIntersect = flatTile.filter((tile) => info.data.includes(tile)),
                stumpIntersect = flatTile.filter((tile) => info.base.includes(tile));

            // Tile contains data that is also a stump.
            if (dataIntersect.length > 0 && stumpIntersect.length > 0) {
                /**
                 * `baseIndex` is the index of the current base in the info data.
                 * `dataBaseIndex` is the index of the base in the tile data.
                 * `cloneTile` is a tile created to prevent changes to original data.
                 */

                let baseIndex = info.base.indexOf(stumpIntersect[0]),
                    dataBaseIndex = flatTile.indexOf(stumpIntersect[0]),
                    cloneTile = [...flatTile];

                // Replace the stump with the cut stump.
                cloneTile[dataBaseIndex] = info.depleted[baseIndex];

                // Store the cloned data.
                this.depleted[index] = cloneTile as RegionTile;
            } else if (dataIntersect.length > 0)
                // Remove tree data.
                this.depleted[index] = flatTile.filter(
                    (tile) => !dataIntersect.includes(tile)
                ) as RegionTile;

            // Set tile data to 0 indicating nothing there instead of empty array '[]'
            if ([this.depleted[index]].flat().length === 0) this.depleted[index] = 0;
        }
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

    public setRespawnTime(time: number): void {
        this.respawnTime = time;
    }

    /**
     * Iterates through each tile in the data (depending on the state of the resource).
     * @param callback The data tile alongside its parsed number index.
     */

    public forEachTile(callback: (tile: RegionTile, index: number) => void): void {
        // Data depends on the state of the resource.
        let data = this.isDepleted() ? this.depleted : this.data;

        for (let index in data) callback(data[index], parseInt(index));
    }

    /**
     * Callback for when a resource undergoes a state change.
     */

    public onStateChange(callback: () => void): void {
        this.stateCallback = callback;
    }
}
