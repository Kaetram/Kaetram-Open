importScripts('../../data/maps/map.js', '../lib/underscore.min.js');

onmessage = function(event) {

    loadCollisionGrid();

    postMessage(mapData);
};

function loadCollisionGrid() {
    var tileIndex = 0;

    mapData.grid = [];

    for (var i = 0; i < mapData.height; i++) {
        mapData.grid[i] = [];
        for (var j = 0; j < mapData.width; j++)
            mapData.grid[i][j] = 0;
    }

    _.each(mapData.collisions, function(tileIndex) {
        var position = indexToGridPosition(tileIndex + 1);
        mapData.grid[position.y][position.x] = 1;
    });

    _.each(mapData.blocking, function(tileIndex) {
        var position = indexToGridPosition(tileIndex + 1);

        if (mapData.grid[position.y])
            mapData.grid[position.y][position.x] = 1;
    });
}

function indexToGridPosition(index) {
    var x = 0, y = 0;

    index -= 1;

    x = getX(index + 1, mapData.width);
    y = Math.floor(index / mapData.width);

    return {
        x: x,
        y: y
    }
}

function getX(index, width) {
    if (index === 0)
        return 0;

    return (index % width === 0) ? width - 1 : (index % width) - 1;
}