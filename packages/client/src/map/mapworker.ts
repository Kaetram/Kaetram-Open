/// <reference lib="webworker" />

import type { MapData } from './map';

let data: MapData;

onmessage = (event) => {
    ({ data } = event);

    loadCollisionGrid();

    postMessage(data);
};

function loadCollisionGrid() {
    let { width, height, collisions } = data,
        grid: number[][] = [];

    for (let y = 0; y < height; y++) {
        grid[y] = [];

        for (let x = 0; x < width; x++) grid[y][x] = 0;
    }

    for (let index of collisions) {
        let { x, y } = indexToGridPosition(index);

        grid[y][x] = 1;
    }

    // for (let tileIndex of blocking) {
    //     let { x, y } = indexToGridPosition(tileIndex);

    //     grid[y][x] = 1;
    // }

    data.grid = grid;
}

function indexToGridPosition(index: number) {
    let { width } = data,
        x = index % width,
        y = Math.floor(index / width);

    return { x, y };
}
