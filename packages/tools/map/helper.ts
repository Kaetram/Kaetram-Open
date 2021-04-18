#!/usr/bin/env ts-node-script

import fs from 'fs';
import _ from 'lodash';
import world from '@kaetram/server/data/map/world.json';
import rawJson from './data/map.json';

export default class Helper {
    #width = world.width;
    #height = world.height;

    public constructor() {
        // Palm Tree Stump

        console.log('hi?');

        _.each(rawJson.layers, (layer: any) => {
            if (layer.name !== 'chests') return;

            let chests = _.cloneDeep(layer.objects);

            _.each(layer.objects, (chestArea: any) => {
                let properties: any = {},
                    newProperties: any = [];

                _.each(chestArea.properties, (property: any) => {
                    properties[property.name] = property.value;
                });

                newProperties.push({
                    name: 'spawnX',
                    type: 'int',
                    value: parseInt(properties.x)
                });

                newProperties.push({
                    name: 'spawnY',
                    type: 'int',
                    value: parseInt(properties.y)
                });

                if ('achievement' in properties)
                    newProperties.push({
                        name: 'achievement',
                        type: 'int',
                        value: parseInt(properties.achievement)
                    });

                if ('items' in properties)
                    newProperties.push({
                        name: 'items',
                        type: 'string',
                        value: properties.items
                    });


                chestArea.properties = newProperties;
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
