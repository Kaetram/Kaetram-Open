#!/usr/bin/env -S yarn ts-node-script

import fs from 'fs';
import path from 'path';

import log from '@kaetram/common/util/log';

import type { MapData } from './mapdata';
import ProcessMap from './processmap';

let resolve = (dir: string): string => path.resolve(__dirname, dir),
    relative = (dir: string): string => path.relative('../../', dir),
    serverDestination = '../../server/data/map/world.json',
    clientDestination = '../../client/data/maps/map.json';

export default class ExportMap {
    /** The map file we are parsing */
    #map = process.argv[2];

    public constructor() {
        if (!this.validMap) {
            log.error(`File ${this.#map} could not be found.`);
            return;
        }

        this.parse();
    }

    private parse(): void {
        let data = fs.readFileSync(this.#map, {
            encoding: 'utf8',
            flag: 'r'
        });

        if (!data) {
            log.error('An error has occurred while trying to read the map.');
            return;
        }

        this.handle(JSON.parse(data));
    }

    private handle(data: MapData): void {
        let processMap = new ProcessMap(data);

        processMap.parse();

        fs.writeFile(resolve(serverDestination), processMap.getMap(), (error) => {
            if (error) throw `An error has occurred while writing map files:\n${error}`;

            log.notice(`Map file successfully saved at ${relative(serverDestination)}.`);
        });

        fs.writeFile(resolve(clientDestination), processMap.getClientMap(), (error) => {
            if (error) throw `An error has occurred while writing map files:\n${error}`;

            log.notice(`Map file successfully saved at ${relative(clientDestination)}.`);
        });
    }

    private validMap(): boolean {
        return !!this.#map && fs.existsSync(this.#map);
    }
}

new ExportMap();
