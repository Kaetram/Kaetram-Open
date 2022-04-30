import _ from 'lodash';

import World from '../world';
import Map from '../map/map';
import Tree from './impl/tree';

import log from '@kaetram/common/util/log';
import { ProcessedMap, ProcessedTree, Tile } from '@kaetram/common/types/map';

import mapData from '../../../data/map/world.json';

let mapInfo = mapData as ProcessedMap;

export default class Trees {
    private map: Map;

    private trees: Tree[] = [];
    private cutTrees: Tree[] = [];

    // Create a clone of the map data
    private data: (number | number[])[] = _.clone(mapInfo.data);

    public constructor(private world: World) {
        this.map = this.world.map;

        this.load();
    }

    /**
     * Iterates through a clone of a map's data and finds
     * all the trees. For every tile that matches tree data,
     * it searches recursively and creates a tree object based
     * on that index data. Once recursion function finds a tree,
     * it is removed from the map data clone to prevent duplicates.
     */

    private load(): void {
        _.each(this.data, (tile: number | number[], index: number) => {
            this.map.forEachTile(tile, (tileId: number) => {
                let treeInfo = this.getTree(tileId);

                if (!treeInfo) return;

                let tree = new Tree(treeInfo.type);

                this.search(treeInfo, tree, index!);

                // Initialize tree cut data.
                tree.load(treeInfo);

                this.trees.push(tree);

                /**
                 * This check is used for anomalies in tree structures. If two trees are too
                 * close together, then they will be recursively identified as one. This may cause
                 * issues. This is what this warning represents. It is ideal to make sure there is
                 * at least one tile in between trees.
                 */

                let coords = this.map.indexToCoord(index);

                if (Object.keys(tree.data).length !== treeInfo.data.length)
                    log.warning(`Tree x: ${coords.x} y: ${coords.y} contains partial data.`);
            });
        });

        log.info(`Loaded ${this.trees.length} tree${this.trees.length > 1 ? 's' : ''}.`);

        // Clear the data to save some memory.
        this.data = [];
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
        let intersection = _.intersection([this.data[index]].flat(), treeInfo.data);

        // If we find no intersection, then tile contains no tree data.
        if (intersection.length === 0) return false;

        // Add the entire tile data onto the tree.
        tree.data[index] = this.data[index];

        // Remove the tree tile from the tiles we are searching.
        if (Array.isArray(this.data[index]))
            this.data[index] = _.difference(this.data[index] as number[], intersection);
        else this.data[index] = 0;

        // Search for tiles recursively right, left, down, up respectively.
        if (this.search(treeInfo, tree, index + 1)) return true;
        if (this.search(treeInfo, tree, index - 1)) return true;
        if (this.search(treeInfo, tree, index + this.map.width)) return true;
        if (this.search(treeInfo, tree, index - this.map.width)) return true;

        return false;
    }

    /**
     * Cuts a tree by grabbing the cut map data from the tree
     * and updating the map and the region associated with the tree.
     * @param tree The tree we are cutting.
     */

    public cutTree(tree: Tree): void {
        this.cutTrees.push(tree);
    }

    /**
     * Updates the global map data with the provided data from a tree.
     * @param data The new data we are writing to the map.
     */

    public setMapData(data: { [index: number]: Tile }): void {
        _.each(data, (tile: Tile, key: string) => this.map.setData(parseInt(key), tile));
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
