import AStar from '../lib/astar';

import type Character from '../entity/character/character';
import type { FunctionTypes } from '../lib/astar';

/**
 * A* pathfinder implementation. We essentially use the grid from the map
 * to calculate pathfinding within the game. The ignores work by temporarily
 * ignoring a collision tile in the grid (removing it) and re-adding it once
 * the pathinding is calculated (re-adding it using `clearIgnores`).
 */

export default class PathFinder {
    private mode: FunctionTypes = 'DEFAULT';

    // List of entities that we are ignoring.
    private ignores: Character[] = [];

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
        endY: number
    ): number[][] {
        this.handleIgnore(grid, true);

        return AStar(grid, [startX, startY], [endX, endY], this.mode);
    }

    /**
     * Responsible for handling the ignore based on the state parameter
     * provided. When we need to ignore, we remove collision from the map grid,
     * and when we need to unignore, we add collision back to the map grid.
     * @param grid Collision grid from the map object.
     * @param ignored Whether or not to remove or add collision to the grid.
     */

    private handleIgnore(grid: number[][], ignored: boolean): void {
        for (let entity of Object.values(this.ignores)) {
            let x = entity.hasPath() ? entity.nextGridX : entity.gridX,
                y = entity.hasPath() ? entity.nextGridY : entity.gridY;

            if (x >= 0 && y >= 0) grid[y][x] = ignored ? 0 : 1;
        }
    }

    /**
     * Adds a character object to the ignore list.
     * @param character The character object we are adding.
     */

    public addIgnore(character: Character): void {
        if (!character) return;

        this.ignores.push(character);
    }

    /**
     * Places back the collision property on the grid.
     * @param grid The grid we from the map object.
     */

    public clearIgnores(grid: number[][]): void {
        this.handleIgnore(grid, false);
        this.ignores = [];
    }
}
