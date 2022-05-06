import _ from 'lodash';

import Character from '../entity/character/character';
import Entity from '../entity/entity';
import AStar from '../lib/astar';

import type { FunctionTypes, PosTuple } from '../lib/astar';

export default class PathFinder {
    private mode: FunctionTypes = 'DEFAULT';

    private grid: number[][] | null = null;

    private blankGrid: number[][] = [];
    private ignores: Character[] = [];

    public constructor(private width: number, private height: number) {
        this.load();
    }

    private load(): void {
        for (let i = 0; i < this.height; i++) {
            this.blankGrid[i] = [];

            for (let j = 0; j < this.width; j++) this.blankGrid[i][j] = 0;
        }

        // log.info('Successfully loaded the pathfinder!');
    }

    public find(
        grid: number[][],
        entity: Entity,
        x: number,
        y: number,
        incomplete: boolean
    ): number[][] {
        let start: PosTuple = [entity.gridX, entity.gridY],
            end: PosTuple = [x, y],
            path;

        this.grid = grid;
        this.applyIgnore(true);

        path = AStar(this.grid, start, end, this.mode);

        if (path.length === 0 && incomplete) path = this.findIncomplete(start, end);

        return path;
    }

    private findIncomplete(start: PosTuple, end: PosTuple): number[][] {
        let incomplete: number[][] = [],
            x,
            y,
            perfect = AStar(this.blankGrid, start, end, this.mode);

        for (let i = perfect.length - 1; i > 0; i--) {
            [x, y] = perfect[i];

            if (this.grid?.[y][x] === 0) {
                incomplete = AStar(this.grid, start, [x, y], this.mode);
                break;
            }
        }

        return incomplete;
    }

    private applyIgnore(ignored: boolean): void {
        let x: number, y: number;

        _.each(this.ignores, (entity) => {
            x = entity.hasPath() ? entity.nextGridX : entity.gridX;
            y = entity.hasPath() ? entity.nextGridY : entity.gridY;

            if (x >= 0 && y >= 0 && this.grid) this.grid[y][x] = ignored ? 0 : 1;
        });
    }

    public ignoreEntity(entity: Character): void {
        if (!entity) return;

        this.ignores.push(entity);
    }

    public clearIgnores(): void {
        this.applyIgnore(false);
        this.ignores = [];
    }
}
