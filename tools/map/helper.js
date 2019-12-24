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

        self.getTileData(964, 129);
        self.getTileData(965, 129);

        self.getTileData(964, 130);
        self.getTileData(965, 130);

        self.getTileData(964, 131);
        self.getTileData(965, 131);
        self.getTileData(966, 131);

        self.getTileData(964, 132);
        self.getTileData(965, 132);
        self.getTileData(966, 132);

        self.getTileData(964, 133);
        self.getTileData(965, 133);


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

}

module.exports = Helper;

function main() {
    new Helper();
}

main();
