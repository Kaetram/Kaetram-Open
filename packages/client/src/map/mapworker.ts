/// <reference lib="webworker" />

import mapData from '../../data/maps/map.json';

type MapDataType = typeof mapData;

export interface MapData extends MapDataType {
    grid: number[][];
    blocking: number[];
}

const data = mapData as MapData;

onmessage = () => {
    loadCollisionGrid();

    postMessage(data);
};

function loadCollisionGrid() {
    data.grid = [];

    const { width, height, grid, collisions } = data;

    for (let i = 0; i < height; i++) {
        grid[i] = [];

        for (let j = 0; j < width; j++) grid[i][j] = 0;
    }

    for (const index of collisions) {
        const { x, y } = indexToGridPosition(index + 1);

        grid[y][x] = 1;
    }

    // for (const tileIndex of data.blocking) {
    //     const { x, y } = indexToGridPosition(tileIndex + 1);

    //     data.grid[y][x] = 1;
    // }
}

function indexToGridPosition(index: number) {
    const x = getX(index, data.width);
    const y = Math.floor((index - 1) / data.width);

    return { x, y };
}

function getX(index: number, width: number) {
    if (index === 0) return 0;

    return index % width === 0 ? width - 1 : (index % width) - 1;
}
