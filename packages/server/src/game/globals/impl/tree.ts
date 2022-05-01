import _ from 'lodash';
import log from '@kaetram/common/util/log';

import { ProcessedTree, Tile } from '@kaetram/common/types/map';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

/**
 * Tree is an object that stores information about the
 * tile data at specific index coordinates. We use this
 * class to quickly grab alternate information about
 * a tile depending on the state of the tree.
 */

export default class Tree {
    public instance = Utils.createInstance(Modules.EntityType.Object);

    // Data contains original tile data from the map
    public data: { [index: number]: Tile } = {};

    // Tile data if the tree has been cut.
    private cutData: { [index: number]: Tile } = {};

    public state: Modules.TreeState = Modules.TreeState.Default;

    private stateCallback?: () => void;

    public constructor(public type: string) {}

    /**
     * Takes information from the `treeInfo` paramater and determines
     * if a tile is either a stump or just tree data. If it's tree data,
     * we remove the tree information. If it's a stump, we replace the
     * stump with the tileId of the cut stump. We store this data for later.
     * @param treeInfo The tree information based on the tree's type.
     */

    public load(treeInfo: ProcessedTree): void {
        // Iterate through all the tile and its indexes in the tree.
        _.each(this.data, (tile: Tile, key: string) => {
            // Whacky conversion because of lodash.
            let index = parseInt(key);

            tile = [tile].flat();

            // Why would you put a tree in the void? How are you even near the tree?
            if (!_.isArray(tile))
                return log.warning(`[${index}] Could not parse tile data for tree.`);

            // Find if the tile contains data or stump data.
            let dataIntersect = _.intersection(tile, treeInfo.data),
                stumpIntersect = _.intersection(tile, treeInfo.stump);

            // Tile contains data that is also a stump.
            if (dataIntersect.length > 0 && stumpIntersect.length > 0) {
                /**
                 * `stumpIndex` is the index of the current stump in the treeInfo data.
                 * `dataStumpIndex` is the index of the stump in the tile data.
                 * `cloneTile` is a tile created to prevent changes to original data.
                 */

                let stumpIndex = treeInfo.stump.indexOf(stumpIntersect[0]),
                    dataStumpIndex = tile.indexOf(stumpIntersect[0]),
                    cloneTile = _.clone(tile);

                // Replace the stump with the cut stump.
                cloneTile[dataStumpIndex] = treeInfo.cutStump[stumpIndex];

                // Store the cloned data.
                this.cutData[index] = cloneTile;
            } else if (dataIntersect.length > 0)
                // Remove tree data.
                this.cutData[index] = _.difference(tile, dataIntersect);

            // Set tile data to 0 indicating nothing there instead of empty array '[]'
            if ([this.cutData[index]].flat().length === 0) this.cutData[index] = 0;
        });
    }

    /**
     * Iterates through each tile in the data (depending on the state of the tree).
     * @param callback The data tile alongside its parsed number index.
     */

    public forEachTile(callback: (data: Tile, index: number) => void): void {
        // Data depends on the state of the tree.
        let data = this.isCut() ? this.cutData : this.data;

        _.each(data, (tile: Tile, index: string) => callback(tile, parseInt(index)));
    }

    /**
     * Checks whether the tree is cut or not.
     * @returns If the current state is that of a cut tree state.
     */

    private isCut(): boolean {
        return this.state === Modules.TreeState.Cut;
    }

    /**
     * Updates the state of the tree and creates a callback.
     * @param state The new state of the tree.
     */

    private setState(state: Modules.TreeState): void {
        log.debug('updating tree state');
        this.state = state;

        this.stateCallback?.();
    }

    /**
     * Callback for when a tree undergoes a state change.
     */

    public onStateChange(callback: () => void): void {
        this.stateCallback = callback;
    }
}
