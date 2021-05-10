#!/usr/bin/env -S yarn ts-node-script

import world from '@kaetram/server/data/map/world.json';

class Helper {
    #width = world.width;
    // #height = world.height;

    public constructor() {
        // Palm Tree Stump
        this.getTileData(167, 263);
        this.getTileData(167, 264);
    }

    private getTileData(x: number, y: number): void {
        const index = this.gridPositionToIndex(x, y);

        console.log(
            `"${index}": { "data": [${
                world.data[index]
            }], "isColliding": ${world.collisions.includes(index)} },`
        );
    }

    private gridPositionToIndex(x: number, y: number): number {
        return y * this.#width + x;
    }

    // private indexToGridPosition(tileIndex: number): { x: number; y: number } {
    //     tileIndex -= 1;

    //     const x = this.getX(tileIndex + 1, this.#width),
    //         y = Math.floor(tileIndex / this.#height);

    //     return {
    //         x: x,
    //         y: y
    //     };
    // }

    // private getX(index: number, width: number): number {
    //     if (index === 0) return 0;

    //     return index % width === 0 ? width - 1 : (index % width) - 1;
    // }
}

export default new Helper();
