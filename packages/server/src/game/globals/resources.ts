import Resource from './impl/resource';

import log from '@kaetram/common/util/log';

import type { ProcessedResource } from '@kaetram/common/types/map';
import type Map from '../map/map';
import type Regions from '../map/regions';
import type World from '../world';

export default class Resources {
    private map: Map;
    private regions: Regions;

    protected resources: { [instance: string]: Resource } = {};

    /**
     * @param data Contains the resource data we are creating resources with. Trees
     * in the case of trees, rocks in the case of mining, etc.
     */

    public constructor(private world: World, private data: ProcessedResource[]) {
        this.map = this.world.map;
        this.regions = this.world.map.regions;

        this.load();
    }

    /**
     * Iterates through the map data and removes tiles which contain
     * resource information. We use this resource data later to create dynamic
     * tiles.
     */

    protected load(): void {
        for (let index in this.map.data) {
            let tile = this.map.data[index];

            this.map.forEachTile(tile, (tileId: number) => {
                let info = this.getResource(tileId);

                if (!info) return;

                // Create the tree.
                this.createResource(info, parseInt(index));
            });
        }
    }

    /**
     * Creates a resource object and initializes all the data associated with it. This creates
     * a resource object and adds it to our dictionary of resources.
     * @param info The raw resource data we are initializing based off of.
     * @param index The index where we first found the resource (the anchor).
     */

    protected createResource(info: ProcessedResource, index: number): void {
        let resource = new Resource(info.type),
            coords = this.map.indexToCoord(index),
            regionIndex = this.regions.getRegion(coords.x, coords.y),
            region = this.regions.get(regionIndex);

        // Load actual resource tile data.
        this.search(info, resource, index);

        // Initialize cut resource's data.
        resource.load(info);

        // Add resource to the region.
        if (region) region.addResource(resource);

        /**
         * This check is used for anomalies in resource structures. If two resources are too
         * close together, then they will be recursively identified as one. This may cause
         * issues. This is what this warning represents. It is ideal to make sure there is
         * at least one tile in between resource.
         */

        if (Object.keys(resource.data).length !== info.data.length)
            log.warning(`Resource x: ${coords.x} y: ${coords.y} contains partial data.`);

        // Add our resource to our list of resources.
        this.resources[resource.instance] = resource;

        // Send an update when a resource's state undergoes a change.
        resource.onStateChange(() => this.regions.sendUpdate(regionIndex));
    }

    /**
     * Recursive iteration scanning the nearby tiles until all resource
     * data tiles are removed and search is exhausted. This removes
     * the data from the cloned map data.
     * @param info The raw resource data we are using to compare against tiles.
     * @param resource The resource data we are adding info onto.
     * @param index Index where we start the search.
     */

    private search(info: ProcessedResource, resource: Resource, index: number): boolean {
        let intersection = [this.map.data[index]].flat().filter((tile) => info.data.includes(tile));

        // If we find no intersection, then tile contains no resource data.
        if (intersection.length === 0) return false;

        // Add the entire tile data onto the resource.
        resource.data[index] = this.map.parseTileData(this.map.data[index]);

        // Remove all tiles from the map data.
        this.map.data[index] = -1;

        // Search for tiles recursively right, left, down, up respectively.
        if (info.data.length > 1) {
            if (this.search(info, resource, index + 1)) return true;
            if (this.search(info, resource, index - 1)) return true;
            if (this.search(info, resource, index + this.map.width)) return true;
            if (this.search(info, resource, index - this.map.width)) return true;
        }

        return false;
    }

    /**
     * Searches the resource instances and finds which resource contains
     * the index data in its data.
     * @param index The index coordinate we are searching for.
     * @returns A resource object if found, otherwise undefined.
     */

    public findResource(index: number): Resource | undefined {
        return Object.values(this.resources).find((resource) => index in resource.data);
    }

    /**
     * Looks through all the resources in the map and
     * finds if the `tileId` is contained within their
     * data.
     * @param tileId The tileId we are checking.
     */

    private getResource(tileId: number): ProcessedResource | undefined {
        return this.data.find((resource) => resource.data.includes(tileId));
    }
}
