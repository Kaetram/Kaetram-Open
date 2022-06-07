/// <reference lib="webworker" />

/**
 * WebWorker just works in the background to create
 * an empty data grid and collision grid.
 */

let width = 0,
    height = 0,
    data: number[] = [],
    grid: number[][] = [];

onmessage = (event) => {
    [width, height] = event.data;

    loadGrids();

    postMessage({
        data,
        grid
    });
};

function loadGrids() {
    for (let y = 0; y < height; y++) {
        grid[y] = [];

        for (let x = 0; x < width; x++) {
            data.push(0);
            grid[y][x] = 0;
        }
    }
}
