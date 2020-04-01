export default (() => {
    /**
     * A* (A-Star) algorithm for a path finder
     * @author  Andrea Giammarchi
     * @license Mit Style License
     */

    function diagonalSuccessors(
        $N?,
        $S?,
        $E?,
        $W?,
        N?,
        S?,
        E?,
        W?,
        grid?,
        rows?,
        cols?,
        result?,
        i?
    ) {
        if ($N) {
            $E && !grid[N][E] && (result[i++] = { x: E, y: N });
            $W && !grid[N][W] && (result[i++] = { x: W, y: N });
        }
        if ($S) {
            $E && !grid[S][E] && (result[i++] = { x: E, y: S });
            $W && !grid[S][W] && (result[i++] = { x: W, y: S });
        }
        return result;
    }

    function diagonalSuccessorsFree(
        $N?,
        $S?,
        $E?,
        $W?,
        N?,
        S?,
        E?,
        W?,
        grid?,
        rows?,
        cols?,
        result?,
        i?
    ) {
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
    }

    function nothingToDo(
        $N?,
        $S?,
        $E?,
        $W?,
        N?,
        S?,
        E?,
        W?,
        grid?,
        rows?,
        cols?,
        result?,
        i?
    ) {
        return result;
    }

    function successors(find, x, y, grid, rows, cols) {
        const N = y - 1;
        const S = y + 1;
        const E = x + 1;
        const W = x - 1;
        const $N = N > -1 && !grid[N][x];
        const $S = S < rows && !grid[S][x];
        const $E = E < cols && !grid[y][E];
        const $W = W > -1 && !grid[y][W];
        const result = [];
        let i = 0;
        $N && (result[i++] = { x, y: N });
        $E && (result[i++] = { x: E, y });
        $S && (result[i++] = { x, y: S });
        $W && (result[i++] = { x: W, y });
        return find($N, $S, $E, $W, N, S, E, W, grid, rows, cols, result, i);
    }

    function diagonal(start?, end?, f1?, f2?) {
        return f2(f1(start.x - end.x), f1(start.y - end.y));
    }

    function euclidean(start?, end?, f1?, f2?) {
        const x = start.x - end.x;
        const y = start.y - end.y;
        return f2(x * x + y * y);
    }

    function manhattan(start?, end?, f1?, f2?) {
        return f1(start.x - end.x) + f1(start.y - end.y);
    }

    function AStar(grid?, start?, end?, f?) {
        const cols = grid[0].length;
        const rows = grid.length;
        const limit = cols * rows;
        const f1 = Math.abs;
        const list = {};
        const result = [];
        const open = [
            {
                x: start[0],
                y: start[1],
                f: 0,
                g: 0,
                v: start[0] + start[1] * cols,
            },
        ];
        let length = 1;
        let f2 = Math.max;
        let adj;
        let distance;
        let find;
        let i;
        let j;
        let max;
        let min;
        let current;
        let next;
        end = { x: end[0], y: end[1], v: end[0] + end[1] * cols };
        switch (f) {
            case 'Diagonal':
            case 'Euclidean':
                find = diagonalSuccessors;
            case 'DiagonalFree':
                distance = diagonal;
                break;

            case 'EuclideanFree':
                f2 = Math.sqrt;
                distance = euclidean;
                break;
            default:
                distance = manhattan;
                find = nothingToDo;
                break;
        }
        find || (find = diagonalSuccessorsFree);

        do {
            if (length > 100) {
                // Don't let it get too crazy.
                return [];
            }

            max = limit;
            min = 0;
            for (i = 0; i < length; ++i) {
                if ((f = open[i].f) < max) {
                    max = f;
                    min = i;
                }
            }

            [current] = open.splice(min, 1);
            if (current.v !== end.v) {
                --length;
                next = successors(find, current.x, current.y, grid, rows, cols);
                for (i = 0, j = next.length; i < j; ++i) {
                    (adj = next[i]).p = current;
                    adj.f = 0;
                    adj.g = 0;
                    adj.v = adj.x + adj.y * cols;
                    if (!(adj.v in list)) {
                        adj.f =
                            (adj.g =
                                current.g + distance(adj, current, f1, f2)) +
                            distance(adj, end, f1, f2);
                        open[length++] = adj;
                        list[adj.v] = 1;
                    }
                }
            } else {
                i = 0;
                length = 0;
                do {
                    result[i++] = [current.x, current.y];
                } while ((current = current.p));
                result.reverse();
            }
        } while (length);

        return result;
    }

    return AStar;
})();
