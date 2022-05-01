import _ from 'lodash';

import World from '../world';
import Map from '../map/map';
import Tree from './impl/tree';
import Regions from '../map/regions';

import log from '@kaetram/common/util/log';
import { ProcessedTree } from '@kaetram/common/types/map';

export default class Trees {
    private map: Map;
    private regions: Regions;

    private trees: { [instance: string]: Tree } = {};

    public constructor(private world: World) {
        this.map = this.world.map;
        this.regions = this.world.map.regions;

        this.load();
    }

    /**
     * Iterates through the map data and removes tiles which contain
     * tree information. We use this tree data later to create dynamic
     * tiles.
     */

    private load(): void {
        _.each(this.map.data, (tile: number | number[], index: number) => {
            this.map.forEachTile(tile, (tileId: number) => {
                let treeInfo = this.getTree(tileId);

                if (!treeInfo) return;

                // Create the tree.
                this.createTree(treeInfo, index);
            });
        });

        log.info(
            `Loaded ${this.trees.length} tree${Object.keys(this.trees).length > 1 ? 's' : ''}.`
        );
    }

    /**
     * Creates a tree object and initializes all the data associated with it.
     * @param treeInfo The raw tree data we are initializing based off of.
     * @param index The index where we first found the tree (the anchor).
     * @returns A tree object that is fully initialized and ready to be added to the list.
     */

    private createTree(treeInfo: ProcessedTree, index: number): void {
        let tree = new Tree(treeInfo.type),
            coords = this.map.indexToCoord(index),
            region = this.regions.get(this.regions.getRegion(coords.x, coords.y));

        // Load actual tree tile data.
        this.search(treeInfo, tree, index!);

        // Initialize cut tree's data.
        tree.load(treeInfo);

        // Add tree to the region.
        if (region) region.addTree(tree);

        /**
         * This check is used for anomalies in tree structures. If two trees are too
         * close together, then they will be recursively identified as one. This may cause
         * issues. This is what this warning represents. It is ideal to make sure there is
         * at least one tile in between trees.
         */

        if (Object.keys(tree.data).length !== treeInfo.data.length)
            log.warning(`Tree x: ${coords.x} y: ${coords.y} contains partial data.`);

        // Add our tree to our list of trees.
        this.trees[tree.instance] = tree;

        // Send an update when a tree's state undergoes a change.
        tree.onStateChange(() => this.regions.sendUpdate(region));
    }

    /**
     * Recursive iteration scanning the nearby tiles until all tree
     * data tiles are removed and search is exhausted. This removes
     * the data from the cloned map data.
     * @param treeInfo The raw tree data we are using to compare against tiles.
     * @param tree The tree data we are adding info onto.
     * @param index Index where we start the search.
     */

    private search(treeInfo: ProcessedTree, tree: Tree, index: number): boolean {
        let intersection = _.intersection([this.map.data[index]].flat(), treeInfo.data);

        // If we find no intersection, then tile contains no tree data.
        if (intersection.length === 0) return false;

        // Add the entire tile data onto the tree.
        tree.data[index] = this.map.data[index];

        // Remove all tiles from the map data.
        this.map.data[index] = -1;

        // Search for tiles recursively right, left, down, up respectively.
        if (this.search(treeInfo, tree, index + 1)) return true;
        if (this.search(treeInfo, tree, index - 1)) return true;
        if (this.search(treeInfo, tree, index + this.map.width)) return true;
        if (this.search(treeInfo, tree, index - this.map.width)) return true;

        return false;
    }

    /**
     * Searches the tree instances and finds which tree contains
     * the index data in its data.
     * @param index The index coordinate we are searching for.
     * @returns A tree object if found, otherwise undefined.
     */

    public findTree(index: number): Tree | undefined {
        return _.find(this.trees, (tree: Tree) => index in tree.data);
    }

    /**
     * Looks through all the trees in the map and
     * finds if the `tileId` is contained within their
     * data.
     * @param tileId The tileId we are checking.
     */

    private getTree(tileId: number): ProcessedTree | undefined {
        return _.find(this.map.trees, (tree: ProcessedTree) => tree.data.includes(tileId));
    }

    /**
     * Iterates through all the trees and returns them.
     * @param callback The tree being iterated.
     */

    private forEachTree(callback: (tree: Tree) => void): void {
        _.each(this.trees, callback);
    }
}
