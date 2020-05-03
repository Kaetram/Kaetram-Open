#!/usr/bin/env node

config = {
    debug: true,
    debugLevel: 'all'
}

let Log = require('../../server/js/util/log'),
    worldClient = require('../../server/data/map/world_client'),
    worldServer = require('../../server/data/map/world_server');

log = new Log();

class Helper {

    constructor() {
        let self = this;

        self.width = worldServer.width;
        self.height = worldServer.height;

        // Normal Tree Stump
        self.getTileData(76, 100);
        self.getTileData(77, 100);
        self.getTileData(76, 101);
        self.getTileData(77, 101);

        log.debug('-----------');

        // Cut Tree Stump
        self.getTileData(74, 103);
        self.getTileData(75, 103);
        self.getTileData(74, 104);
        self.getTileData(75, 104);

        //for (let i = 1; i < 5; i++)
        //    for (let j = 1; j < 5; j++)
        //        self.getTileData(9 + i, 91 + j);
    }

    getTileData(x, y) {
        let self = this,
            index = self.gridPositionToIndex(x, y);

        console.log(`"${index}": { "data": [${worldClient.data[index]}], "isColliding": ${worldClient.collisions.indexOf(index) > -1} },`);
        //log.info(index + ' -- ' + worldClient.data[index]);
    }

    gridPositionToIndex(x, y) {
        return (y * this.width) + x;
    }

    indexToGridPosition(tileIndex) {
        let self = this;

        tileIndex -= 1;

        let x = self.getX(tileIndex + 1, self.width),
            y = Math.floor(tileIndex / self.width);

        return {
            x: x,
            y: y
        }
    }

    getX(index, width) {
        if (index === 0)
            return 0;

        return (index % width === 0) ? width - 1 : (index % width) - 1;
    }

}

module.exports = Helper;

function main() {
    new Helper();
}

main();
