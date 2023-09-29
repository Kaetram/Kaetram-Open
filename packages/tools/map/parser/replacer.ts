#!/usr/bin/env -S yarn tsx

import fs from 'node:fs';

import replace from './replace.json';

import log from '@kaetram/common/util/log';

import type { Layer } from './mapdata';

/**
 * Used for specifying tiles to replace the layers.
 */

/**
 * 3446, 2956
 * 3510, 3020
 * 3574, 3084
 * 3638, 3148
 * 3702, 3212
 * 3766, 3276
 */

export default class Replacer {
    /** The map file we are parsing */
    #map = process.argv[2];

    private replace: { [key: number]: number } = replace;

    public constructor() {
        if (Object.keys(replace).length === 0) {
            log.error('No tiles to replace.');
            return;
        }

        if (!this.fileExists()) {
            log.error('The map file path is invalid.');
            return;
        }

        let data = fs.readFileSync(this.#map, {
            encoding: 'utf8',
            flag: 'r'
        });

        if (!data) {
            log.error('An error has occurred while trying to read the map.');
            return;
        }

        let map = JSON.parse(data);

        // Format the replace to include tileset index.
        for (let i in this.replace) {
            if (!i.includes('+')) continue;

            let [tileset, tile] = i.split('+'),
                index = ~~tileset;

            if (index < 1) continue;

            let offset = 0;

            for (let j = index; j > 0; j--) offset += map.tilesets[j].tilecount;

            this.replace[offset + ~~tile] = this.replace[i];

            delete this.replace[i];
        }

        fs.writeFileSync(`${this.#map}.backup_${Date.now()}`, JSON.stringify(map));

        for (let layer of map.layers) if (layer.type === 'tilelayer') this.replaceLayer(layer);

        fs.writeFileSync(this.#map, JSON.stringify(map));
    }

    /**
     * Takes a raw layer from the Tiled map data (must be in JSON format) and replaces the tiles with the ones specified in the replace.json file.
     * @param layer The layer to replace the tiles in.
     */

    private replaceLayer(layer: Layer): void {
        let count = 0;

        for (let i in layer.data) {
            let tile = layer.data[i] - 1;

            if (tile < 0) continue;

            if (tile in this.replace) {
                layer.data[i] = ~~this.replace[tile] + 1;

                count++;
            }
        }

        // Don't log anything if we didn't replace anything.
        if (count === 0) return;

        log.info(`Replaced ${count} tiles in layer ${layer.name}.`);
    }

    /**
     * Checks if the map file path exists.
     * @returns Whether or not the map file path is valid.
     */

    private fileExists(): boolean {
        return !!this.#map && fs.existsSync(this.#map);
    }
}

new Replacer();
