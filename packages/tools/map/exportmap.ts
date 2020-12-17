#!/usr/bin/env ts-node

import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import log from '../../server/src/util/log';

import MapData from './mapdata';
import ProcessMap from './processmap';

const relative = (dir: string): string => path.relative('../../', dir);
const serverDestination = '../../server/data/map/world.json';
const clientDestination = '../../client/data/maps/map.json';

export default class ExportMap {

    map: string; // The map file we are parsing

    constructor() {
        this.map = process.argv[2];

        if (!this.validMap) {
            log.error(`File ${this.map} could not be found.`);
            return;
        }

        this.parse();
    }

    parse() {
        let data = fs.readFileSync(this.map, {
            encoding: 'utf8',
            flag: 'r'
        });

        if (!data) {
            log.error('An error has occurred while trying to read the map.');
            return;
        }

        this.handle(JSON.parse(data));
    }

    handle(data: MapData) {
        let processMap = new ProcessMap(data);

        processMap.parse();

        fs.writeFile(serverDestination, processMap.getMap(), error => {
            if (error) throw 'An error has occurred while writing map files.';

            log.notice(`Map file successfully saved at ${relative(serverDestination)}.`);
        });

        fs.writeFile(clientDestination, processMap.getClientMap(), error => {
            if (error) throw 'An error has occurred while writing map files.';

            log.notice(`Map file successfully saved at ${relative(clientDestination)}.`);
        });
    }

    validMap() {
        return this.map && fs.existsSync(this.map);
    }

}

new ExportMap();