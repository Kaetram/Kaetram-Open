#!/usr/bin/env ts-node

import world from '@kaetram/server/data/map/world.json';

export default class Helper {
    width: number;
    height: number;

    constructor() {
        this.width = world.width;
        this.height = world.height;

        // Palm Tree Stump
        this.getTileData(167, 263);
        this.getTileData(167, 264);

        //for (let i = 1; i < 5; i++)
        //    for (let j = 1; j < 5; j++)
        //        this.getTileData(9 + i, 91 + j);
    }

    getTileData(x: number, y: number): void {
        const index = this.gridPositionToIndex(x, y);

        console.log(
            `"${index}": { "data": [${world.data[index]}], "isColliding": ${
                world.collisions.indexOf(index) > -1
            } },`
        );
    }

    gridPositionToIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    indexToGridPosition(tileIndex: number): { x: number; y: number } {
        tileIndex -= 1;

        const x = this.getX(tileIndex + 1, this.width),
            y = Math.floor(tileIndex / this.width);

        return {
            x: x,
            y: y
        };
    }

    getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }
}

new Helper();
