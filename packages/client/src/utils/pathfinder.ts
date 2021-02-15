import _ from 'lodash';

import Character from '../entity/character/character';
import Entity from '../entity/entity';
import AStar from '../lib/astar';

export default class PathFinder {
    width: number;
    height: number;
    mode: string;
    grid: number[][];
    blankGrid: number[][];
    ignores: Character[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.mode = 'DEFAULT';

        this.grid = null;
        this.blankGrid = [];
        this.ignores = [];

        this.load();
    }

    load(): void {
        for (let i = 0; i < this.height; i++) {
            this.blankGrid[i] = [];

            for (let j = 0; j < this.width; j++) this.blankGrid[i][j] = 0;
        }

        // log.info('Successfully loaded the pathfinder!');
    }

    find(grid: number[][], entity: Entity, x: number, y: number, incomplete: boolean): number[][] {
        const start = [entity.gridX, entity.gridY];
        const end = [x, y];
        let path;

        this.grid = grid;
        this.applyIgnore(true);

        path = AStar(this.grid, start, end, this.mode);

        if (path.length === 0 && incomplete) path = this.findIncomplete(start, end);

        return path;
    }

    findIncomplete(start: number[], end: number[]): number[][] {
        let incomplete = [],
            x,
            y;

        const perfect = AStar(this.blankGrid, start, end, this.mode);

        for (let i = perfect.length - 1; i > 0; i--) {
            x = perfect[i][0];
            y = perfect[i][1];

            if (this.grid[y][x] === 0) {
                incomplete = AStar(this.grid, start, [x.y], this.mode);
                break;
            }
        }

        return incomplete;
    }

    applyIgnore(ignored: boolean): void {
        let x: number, y: number;

        _.each(this.ignores, (entity) => {
            x = entity.hasPath() ? entity.nextGridX : entity.gridX;
            y = entity.hasPath() ? entity.nextGridY : entity.gridY;

            if (x >= 0 && y >= 0) this.grid[y][x] = ignored ? 0 : 1;
        });
    }

    ignoreEntity(entity: Character): void {
        if (!entity) return;

        this.ignores.push(entity);
    }

    clearIgnores(): void {
        this.applyIgnore(false);
        this.ignores = [];
    }
}
