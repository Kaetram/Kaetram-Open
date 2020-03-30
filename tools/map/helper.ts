#!/usr/bin/env node

import WorldClient from '../../server/data/map/world_client.json';
import worldServer from '../../server/data/map/world_server.json';

const worldClient: any = WorldClient;

class Helper {
    public width: any;
    public height: any;

    constructor() {
        this.width = worldServer.width;
        this.height = worldServer.height;

        this.getTileData(790, 36);
        this.getTileData(790, 42);

        // for (let i = 1; i < 5; i++)
        //    for (let j = 1; j < 5; j++)
        //        this.getTileData(9 + i, 91 + j);
    }

    getTileData(x, y) {
        const index = this.gridPositionToIndex(x, y);

        console.info(
            `"${index}": { "data": [${
                worldClient.data[index]
            }], "isColliding": ${worldClient.collisions.indexOf(index) > -1} },`
        );
        // console.info(index + ' -- ' + worldClient.data[index]);
    }

    gridPositionToIndex(x, y) {
        return y * this.width + x;
    }

    indexToGridPosition(tileIndex) {
        tileIndex -= 1;

        const x = this.getX(tileIndex + 1, this.width);
        const y = Math.floor(tileIndex / this.width);

        return {
            x,
            y
        };
    }

    getX(index, width) {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }
}

module.exports = Helper;

function main() {
    new Helper();
}

main();
