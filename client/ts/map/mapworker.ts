import mapData from '../../data/maps/map';
import _ from 'underscore';

function getX(index, width) {
    if (index === 0) return 0;

    return index % width === 0 ? width - 1 : (index % width) - 1;
}

function indexToGridPosition(index) {
    let x = 0;
    let y = 0;

    index -= 1;

    x = getX(index + 1, mapData.width);
    y = Math.floor(index / mapData.width);

    return {
        x: x,
        y: y
    };
}

function loadCollisionGrid() {
    const tileIndex = 0;

    mapData.grid = [];

    for (let i = 0; i < mapData.height; i++) {
        mapData.grid[i] = [];
        for (let j = 0; j < mapData.width; j++) mapData.grid[i][j] = 0;
    }

    _.each(mapData.collisions, function(tileIndex) {
        const position = indexToGridPosition(tileIndex + 1);
        mapData.grid[position.y][position.x] = 1;
    });

    _.each(mapData.blocking, function(tileIndex) {
        const position = indexToGridPosition(tileIndex + 1);

        if (mapData.grid[position.y]) mapData.grid[position.y][position.x] = 1;
    });
}

onmessage = (event) => {
    loadCollisionGrid();

    postMessage(mapData, '0.0.0.0');
};
