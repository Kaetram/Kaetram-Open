/// <reference lib="webworker" />

import type { MapData } from './map';

let data: MapData;

onmessage = (event) => {
    ({ data } = event);

    loadCollisionGrid();

    postMessage(data);
};

function loadCollisionGrid() {
    let { width, height } = data,
        grid: number[][] = [];

    for (let y = 0; y < height; y++) {
        grid[y] = [];

        for (let x = 0; x < width; x++) grid[y][x] = 0;
    }

    data.grid = grid;
}
