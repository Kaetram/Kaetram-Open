/// <reference lib="webworker" />

import mapData from '../../data/maps/map.json';

type MapDataType = typeof mapData;

export interface MapData extends MapDataType {
    grid: number[][];
    blocking: number[];
}

let data = mapData as MapData,
    { width, height, collisions } = data;

onmessage = () => {
    loadCollisionGrid();

    postMessage(data);
};

function loadCollisionGrid() {
    let grid: number[][] = [];

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

    //     data.grid[y][x] = 1;
    // }

    data.grid = grid;
}

function indexToGridPosition(index: number) {
    let x = index % width,
        y = Math.floor(index / width);

    return { x, y };
}
