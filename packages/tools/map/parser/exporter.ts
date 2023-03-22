#!/usr/bin/env -S yarn tsx

import fs from 'node:fs';
import path from 'node:path';

import Parser from './parser';

import log from '@kaetram/common/util/log';

let resolve = (dir: string): URL => new URL(dir, import.meta.url),
    relative = (dir: string): string => path.relative('../../../', dir),
    serverDestination = '../../../server/data/map/world.json',
    clientDestination = '../../../client/data/maps/map.json',
    tilesetDirectory = '../../../client/public/img/tilesets/',
    mapDirectory = '../data/';

export default class Exporter {
    /** The map file we are parsing */
    #map = process.argv[2];

    public constructor() {
        // Check that the map file exists.
        if (!this.fileExists()) {
            log.error(`File ${this.#map} could not be found.`);
            return;
        }

        // Parse and create the map files.
        this.parse();
    }

    private parse(): void {
        // Read the map file synchronously.
        let data = fs.readFileSync(this.#map, {
            encoding: 'utf8',
            flag: 'r'
        });

        // Check that the data is valid
        if (!data) {
            log.error('An error has occurred while trying to read the map.');
            return;
        }

        // Create the parser and subsequently parse the map
        let parser = new Parser(JSON.parse(data)),
            tilesets = parser.getTilesets();

        // Write the server map file.
        fs.writeFile(resolve(serverDestination), parser.getMap(), (error) => {
            if (error)
                throw new Error(`An error has occurred while writing map files:`, { cause: error });

            log.notice(`Map file successfully saved at ${relative(serverDestination)}.`);
        });

        // Write the client map file.
        fs.writeFile(resolve(clientDestination), parser.getClientMap(), (error) => {
            if (error)
                throw new Error(`An error has occurred while writing map files:`, { cause: error });

            log.notice(`Map file successfully saved at ${relative(clientDestination)}.`);
        });

        // Copy tilesets from the map to the client.
        for (let key in tilesets) {
            let name = `tilesheet-${parseInt(key) + 1}.png`;

            fs.copyFile(
                resolve(path.join(mapDirectory, name)),
                resolve(path.join(tilesetDirectory, name)),
                (error) => {
                    if (error)
                        throw new Error(`An error has occurred while copying tilesets:\n`, {
                            cause: error
                        });
                }
            );
        }
    }

    /**
     * Checks if the map file path exists.
     * @returns Whether or not the map file path is valid.
     */

    private fileExists(): boolean {
        return !!this.#map && fs.existsSync(this.#map);
    }
}

new Exporter();
