#!/usr/bin/env ts-node-script

import fs from 'fs';
import _ from 'lodash';
import world from '@kaetram/server/data/map/world.json';
import rawJson from './data/map-refactor.json';

export default class Helper {
    #width = world.width;
    #height = world.height;

    public constructor() {
        // Palm Tree Stump

        console.log('hi?');

        _.each(rawJson.layers, (layer: any) => {
            if (layer.name !== 'doors') return;

            let doorObjects = _.cloneDeep(layer.objects);

            _.each(layer.objects, (door: any) => {
                let properties: any = {},
                    newProperties: any = [];

                _.each(door.properties, (property: any) => {
                    properties[property.name] = property.value;
                });

                if ('x' in properties) {
                    let doorId = this.findDoorId(doorObjects, properties.x, properties.y);

                    if (doorId) {
                        newProperties.push({
                            name: 'destination',
                            type: 'object',
                            value: doorId
                        });
                        newProperties.push({
                            name: 'orientation',
                            type: 'string',
                            value: properties.o
                        })
                    }
                }

                door.properties = newProperties;
            });
        });

        fs.writeFileSync('map-test.json', JSON.stringify(rawJson));
    }

    private findDoorId(doors: any, x: number, y: number) {
        for (let i in doors)
            if (doors[i].x === x * 16 && doors[i].y === y * 16)
                return doors[i].id;

        return null;
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

    private indexToGridPosition(tileIndex: number): { x: number; y: number } {
        tileIndex -= 1;

        const x = this.getX(tileIndex + 1, this.#width),
            y = Math.floor(tileIndex / this.#height);

        return {
            x: x,
            y: y
        };
    }

    private getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }
}

new Helper();
