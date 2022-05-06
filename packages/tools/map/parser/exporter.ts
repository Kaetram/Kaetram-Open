#!/usr/bin/env -S yarn ts-node-script

import fs from 'fs';
import path from 'path';

import log from '@kaetram/common/util/log';

import Parser from './parser';

let resolve = (dir: string): string => path.resolve(__dirname, dir),
    relative = (dir: string): string => path.relative('../../../', dir),
    serverDestination = '../../../server/data/map/world.json',
    clientDestination = '../../../client/data/maps/map.json';

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
            if (error) throw `An error has occurred while writing map files:\n${error}`;

            log.notice(`Map file successfully saved at ${relative(serverDestination)}.`);
        });

        // Write the client map file.
        fs.writeFile(resolve(clientDestination), parser.getClientMap(), (error) => {
            if (error) throw `An error has occurred while writing map files:\n${error}`;

            log.notice(`Map file successfully saved at ${relative(clientDestination)}.`);
        });
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
