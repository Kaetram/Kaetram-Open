export type PosTuple = [x: number, y: number];

export type FunctionTypes = 'Diagonal' | 'Euclidean' | 'DiagonalFree' | 'EuclideanFree' | 'DEFAULT';

interface Result {
    x: number;
    y: number;
    f?: number;
    g?: number;
    v?: number;
    p?: Result;
}

type Successor = (
    $N: boolean,
    $S: boolean,
    $E: boolean,
    $W: boolean,
    N: number,
    S: number,
    E: number,
    W: number,
    grid: number[][],
    rows: number,
    cols: number,
    result: Result[],
    i: number
) => Result[];

type MathFunction = (
    start: Position,
    end: Position,
    f1: (...values: number[]) => number,
    f2: (...values: number[]) => number
) => number;

/**
 * A* (A-Star) algorithm for a path finder
 * @author  Andrea Giammarchi
 * @license Mit Style License
 */

function AStar(
    grid: number[][],
    start: [number, number],
    end: [number, number],
    f: FunctionTypes
): number[][] {
    let cols = grid[0].length,
        rows = grid.length,
        limit = cols * rows,
        f2 = Math.max,
        list: { [key: number]: number } = {},
        result: [x: number, y: number][] = [],
        open: Result[] = [
            {
                x: start[0],
                y: start[1],
                f: 0,
                g: 0,
                v: start[0] + start[1] * cols
            }
        ],
        length = 1,
        distance: MathFunction,
        find: Successor,
        current: Result,
        next: Result[],
        endPos = { x: end[0], y: end[1], v: end[0] + end[1] * cols };

    switch (f) {
        case 'Diagonal':
        case 'Euclidean': {
            find = diagonalSuccessors;
        }
        case 'DiagonalFree': {
            distance = diagonal;
            break;
        }

        case 'EuclideanFree': {
            f2 = Math.sqrt;
            distance = euclidean;
            break;
        }

        default: {
            distance = manhattan;
            find = nothingToDo;
            break;
        }
    }

    find ||= diagonalSuccessorsFree;

    do {
        if (length > 100)
            // Don't let it get too crazy.
            return [];

        let max = limit,
            min = 0;

        for (let i = 0; i < length; ++i) {
            let openF = open[i].f!;

            if (openF < max) {
                max = openF;
                min = i;
            }
        }

        [current] = open.splice(min, 1);
        if (current.v === endPos.v) {
            let i = (length = 0);

            do result[i++] = [current.x, current.y];
            while ((current = current.p!));

            result.reverse();
        } else {
            --length;
            next = successors(find, current.x, current.y, grid, rows, cols);

            for (let i = 0, j = next.length; i < j; ++i) {
                let adj = next[i];

                adj.p = current;
                adj.f = adj.g = 0;
                adj.v = adj.x + adj.y * cols;

                if (!(adj.v in list)) {
                    adj.f =
                        (adj.g = current.g! + distance(adj, current, Math.abs, f2)) +
                        distance(adj, endPos, Math.abs, f2);

                    open[length++] = adj;
                    list[adj.v] = 1;
                }
            }
        }
    } while (length);

    return result;
}

let diagonalSuccessors: Successor = ($N, $S, $E, $W, N, S, E, W, grid, _rows, _cols, result, i) => {
        if ($N) {
            $E && !grid[N][E] && (result[i++] = { x: E, y: N });
            $W && !grid[N][W] && (result[i++] = { x: W, y: N });
        }
        if ($S) {
            $E && !grid[S][E] && (result[i++] = { x: E, y: S });
            $W && !grid[S][W] && (result[i++] = { x: W, y: S });
        }

        return result;
    },
    diagonalSuccessorsFree: Successor = (
        $N,
        $S,
        $E,
        $W,
        N,
        S,
        E,
        W,
        grid,
        rows,
        cols,
        result,
        i
    ) => {
        $N = N > -1;
        $S = S < rows;
        $E = E < cols;
        $W = W > -1;

        if ($E) {
            $N && !grid[N][E] && (result[i++] = { x: E, y: N });
            $S && !grid[S][E] && (result[i++] = { x: E, y: S });
        }
        if ($W) {
            $N && !grid[N][W] && (result[i++] = { x: W, y: N });
            $S && !grid[S][W] && (result[i++] = { x: W, y: S });
        }

        return result;
    },
    nothingToDo: Successor = (_$N, _$S, _$E, _$W, _N, _S, _E, _W, _grid, _rows, _cols, result) =>
        result;

function successors(
    find: Successor,
    x: number,
    y: number,
    grid: number[][],
    rows: number,
    cols: number
) {
    let N = y - 1,
        S = y + 1,
        E = x + 1,
        W = x - 1,
        $N = N > -1 && !grid[N][x],
        $S = S < rows && !grid[S][x],
        $E = E < cols && !grid[y][E],
        $W = W > -1 && !grid[y][W],
        result = [],
        i = 0;

    $N && (result[i++] = { x, y: N });
    $E && (result[i++] = { x: E, y });
    $S && (result[i++] = { x, y: S });
    $W && (result[i++] = { x: W, y });

    return find($N, $S, $E, $W, N, S, E, W, grid, rows, cols, result, i);
}

let diagonal: MathFunction = (start, end, f1, f2) => f2(f1(start.x - end.x), f1(start.y - end.y)),
    euclidean: MathFunction = (start, end, _f1, f2) => {
        let x = start.x - end.x,
            y = start.y - end.y;

        return f2(x * x + y * y);
    },
    manhattan: MathFunction = (start, end, f1) => f1(start.x - end.x) + f1(start.y - end.y);

export default AStar;
