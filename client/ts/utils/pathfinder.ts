import _ from 'underscore';

import Character from '../entity/character/character';
import AStar from '../lib/astar';

export default class Pathfinder {
    width: number;
    height: number;
    mode: string;
    grid: number[];
    blankGrid: number[][];
    ignores: Character[];

    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.mode = 'DEFAULT';

        this.grid = null;
        this.blankGrid = [];
        this.ignores = [];

        this.load();
    }

    load() {
        for (let i = 0; i < this.height; i++) {
            this.blankGrid[i] = [];

            for (let j = 0; j < this.width; j++) this.blankGrid[i][j] = 0;
        }

        // console.info('Successfully loaded the pathfinder!');
    }

    find(grid, entity, x, y, incomplete) {
        const start = [entity.gridX, entity.gridY];
        const end = [x, y];
        let path;

        this.grid = grid;
        this.applyIgnore(true);

        path = AStar(this.grid, start, end, this.mode);

        if (path.length === 0 && incomplete) {
            path = this.findIncomplete(start, end);
        }

        return path;
    }

    findIncomplete(start, end) {
        let incomplete = [];
        let x;
        let y;
        const perfect = AStar(this.blankGrid, start, end, this.mode);

        for (let i = perfect.length - 1; i > 0; i--) {
            [x, y] = perfect[i];

            if (this.grid[y][x] === 0) {
                incomplete = AStar(this.grid, start, [x.y], this.mode);
                break;
            }
        }

        return incomplete;
    }

    applyIgnore(ignored) {
        let x;
        let y;

        _.each(this.ignores, (entity) => {
            x = entity.hasPath() ? entity.nextGridX : entity.gridX;
            y = entity.hasPath() ? entity.nextGridY : entity.gridY;

            if (x >= 0 && y >= 0) this.grid[y][x] = ignored ? 0 : 1;
        });
    }

    ignoreEntity(entity) {
        if (!entity) return;

        this.ignores.push(entity);
    }

    clearIgnores() {
        this.applyIgnore(false);
        this.ignores = [];
    }
}
