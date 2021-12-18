/// <reference lib="webworker" />

import mapData from '../../data/maps/map.json';

type MapDataType = typeof mapData;

export interface MapData extends MapDataType {
    grid: number[][];
    blocking: number[];
}

let data = mapData as MapData,
    { width, height } = data;

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

    data.grid = grid;
}
