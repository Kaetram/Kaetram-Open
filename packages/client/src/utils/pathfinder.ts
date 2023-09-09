import AStar from '../lib/astar';

import type { FunctionTypes } from '../lib/astar';

/**
 * A* pathfinder implementation. We essentially use the grid from the map
 * to calculate pathfinding within the game. The ignores work by temporarily
 * ignoring a collision tile in the grid (removing it) and re-adding it once
 * the pathinding is calculated (re-adding it using `clearIgnores`).
 */

export interface TileIgnore {
    x: number;
    y: number;
    fake?: boolean;
}
export default class PathFinder {
    private mode: FunctionTypes = 'DEFAULT';

    /**
     * Finds and returns a pathing from the startX and startY (representing
     * grid coordinates) to the endX and endY. We use the collision grid
     * directly from the map to find the path.
     * @param grid Collision grid from the map object (updated based on region data).
     * @param startX Starting grid X coordinate.
     * @param startY Starting grid Y coordinate.
     * @param endX Ending grid X coordinate.
     * @param endY Ending grid Y coordinate.
     * @returns An 2D array of grid coordinates representing the path. Each entry
     * contains an array of [x, y] coordinates.
     */

    public find(
        grid: number[][],
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        ignores: TileIgnore[] = []
    ): number[][] {
        // Parse through the ignores and remove collision from the grid.
        this.handleIgnore(grid, ignores, true);

        // Store the result as a variable so we can re-add collision to the grid.
        let result = AStar(grid, [startX, startY], [endX, endY], this.mode);

        // Parse through the ignores and re-add collision to the grid.
        this.handleIgnore(grid, ignores);

        return result;
    }

    /**
     * Responsible for handling the ignore based on the state parameter
     * provided. When we need to ignore, we remove collision from the map grid,
     * and when we need to unignore, we add collision back to the map grid.
     * @param grid Collision grid from the map object.
     * @param ignored Whether or not to remove or add collision to the grid.
     */

    private handleIgnore(grid: number[][], ignores: TileIgnore[], ignored = false): void {
        for (let ignore of ignores) {
            // Skip invalid ignores.
            if (ignore.x < 0 || ignore.y < 0) continue;

            /**
             * This functionally essentially marks colliding tile as non-colliding so that the pathfinder
             * can find a path to said tile. There are instances however, where we want to mark nearby
             * tiles as non-colliding, which also includes non-colliding tiles. What happens is that when
             * we re-add collision to the grid, we re-add collision to the non-colliding tiles as well.
             * We mark these tiles as `fake` so that we can ignore them when re-adding collision to the grid.
             */

            if (ignore.fake) continue;

            if (grid[ignore.y][ignore.x] === 0) ignore.fake = true;

            grid[ignore.y][ignore.x] = ignored ? 0 : 1;
        }
    }
}
