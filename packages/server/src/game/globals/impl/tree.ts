import Map from '../../map/map';

/**
 * Tree is a type of global object that directly
 * interacts with the map depending on its state.
 * When it is cut, it removes all the tree data from
 * the overall map data and replaces the stump elements
 * with the cut stump.
 */

export default class Tree {
    public data: { [index: number]: number | number[] } = {};

    public constructor(public type: string) {}
}
