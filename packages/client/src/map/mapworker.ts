/// <reference lib="webworker" />

import mapData from '../../data/maps/map.json';

type MapDataType = typeof mapData;

export interface MapData extends MapDataType {
    grid: number[][];
    blocking: number[];
}

const data = mapData as MapData,
    { width, height, collisions } = data;

onmessage = () => {
    loadCollisionGrid();

    postMessage(data);
};

function loadCollisionGrid() {
    const grid: number[][] = [];

    for (let y = 0; y < height; y++) {
        grid[y] = [];

        for (let x = 0; x < width; x++) grid[y][x] = 0;
    }

    for (const index of collisions) {
        const { x, y } = indexToGridPosition(index);

        grid[y][x] = 1;
    }

    // for (const tileIndex of blocking) {
    //     const { x, y } = indexToGridPosition(tileIndex);

    //     data.grid[y][x] = 1;
    // }

    data.grid = grid;
}

function indexToGridPosition(index: number) {
    const x = index % width,
        y = Math.floor(index / width);

    return { x, y };
}
