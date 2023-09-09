#!/usr/bin/env -S yarn tsx

import fs from 'node:fs';
import path from 'node:path';

import Parser from './parser';

import log from '@kaetram/common/util/log';

import type { ProcessedTileset } from '@kaetram/common/types/map';

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
        let parser = new Parser(JSON.parse(data));

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

        // Copy the tilesets to the client directory.
        this.copyTilesets(parser.getTilesets());
    }

    /**
     * Copies a list of tilesets from their directories and places them in the client directory.
     * @param tilesets A list of tilesets used to determine the path of where we copy them
     */

    private copyTilesets(tilesets: ProcessedTileset[]): void {
        for (let tileset of tilesets) {
            let paths = tileset.path.split('/');

            // Tilesets are placed in the root directory, just copy them normally.
            if (paths.length === 1) {
                this.copyTileset(tileset.path);
                continue;
            }

            // Remove the first element of the array (the first directory the tileset is in)
            paths.shift();

            // The image name is the last element of the array.
            let writePath = paths.join('/'), // Store the path with image name for writing.
                destination = tilesetDirectory; // Used to update subdirectories

            // Remove the last element of the array (the image name)
            paths.pop();

            // Iterate through the remaining elements (directories) and ensure they exist.
            for (let directory of paths) {
                // Update the final destination directory as we parse, and use that to check.
                destination = `${destination}/${directory}`;

                if (!fs.existsSync(resolve(destination))) fs.mkdirSync(resolve(destination));
            }

            // Copies the tileset from the map directory to the client directory.
            this.copyTileset(writePath, tileset.path);
        }
    }

    /**
     * Copies a file from a spcified path to another. We externalize this function
     * so we can do checking upon the directory prior to copying.
     * @param location The path of the file that we use to copy and write to.
     * @param from (Optional) Used to specify a location to copy from.
     */

    private copyTileset(location: string, from = location): void {
        fs.copyFile(
            resolve(path.join(mapDirectory, from)),
            resolve(path.join(tilesetDirectory, location)),
            (error) => {
                if (error)
                    throw new Error(`An error has occurred while copying tilesets:\n`, {
                        cause: error
                    });
            }
        );
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
