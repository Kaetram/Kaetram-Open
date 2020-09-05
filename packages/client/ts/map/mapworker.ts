/// <reference lib="webworker" />

import _ from 'lodash';

import mapData from '../../data/maps/map.json';

// declare const _: LoDashStatic;

type MapDataType = typeof mapData;
// declare const mapData: MapDataType;

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
    // const tileIndex = 0;

    data.grid = [];

    for (let i = 0; i < data.height; i++) {
        data.grid[i] = [];
        for (let j = 0; j < data.width; j++) data.grid[i][j] = 0;
    }

    _.each(data.collisions, (tileIndex) => {
        const position = indexToGridPosition(tileIndex + 1);
        data.grid[position.y][position.x] = 1;
    });

    _.each(data.blocking, (tileIndex) => {
        const position = indexToGridPosition(tileIndex + 1);

        if (data.grid[position.y]) data.grid[position.y][position.x] = 1;
    });
}

function indexToGridPosition(index) {
    let x = 0,
        y = 0;

    index -= 1;

    x = getX(index + 1, data.width);
    y = Math.floor(index / data.width);

    return {
        x: x,
        y: y
    };
}

function getX(index, width) {
    if (index === 0) return 0;

    return index % width === 0 ? width - 1 : (index % width) - 1;
}

export default class MapWorker {}
