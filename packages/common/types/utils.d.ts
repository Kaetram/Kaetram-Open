/**
 * A 2D position or vertex.
 */

declare interface Position {
    x: number;
    y: number;

    gridX?: number;
    gridY?: number;
}

/**
 * Used in the client-sided part of the game. This contains the absolute position
 * of an object as well as its grid position Math.floor(x / tileSize).
 */

declare interface Coordinate {
    x: number;
    y: number;

    gridX: number;
    gridY: number;
}
