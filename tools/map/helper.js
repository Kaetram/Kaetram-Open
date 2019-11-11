#!/usr/bin/env node

let Log = require('log'),
    log = new Log(Log.DEBUG),
    worldClient = require('../../server/data/map/world_client'),
    worldServer = require('../../server/data/map/world_server');

class Helper {

    constructor() {
        let self = this;

        self.width = worldServer.width;
        self.height = worldServer.height;

        self.getTileData(9, 92);

        self.getTileData(8, 93);
        self.getTileData(9, 93);
        self.getTileData(10, 93);

        self.getTileData(8, 94);
        self.getTileData(9, 94);
        self.getTileData(10, 94);

        //for (let i = 1; i < 5; i++)
        //    for (let j = 1; j < 5; j++)
        //        self.getTileData(9 + i, 91 + j);
    }

    getTileData(x, y) {
        let self = this,
            index = self.gridPositionToIndex(x, y);

        console.log(`"${index}": { "data": [${worldClient.data[index]}], "isColliding": true },`);
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

}

module.exports = Helper;

function main() {
    new Helper();
}

main();
