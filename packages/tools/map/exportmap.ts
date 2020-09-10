#!/usr/bin/env node

import ProcessMap from './processmap';

import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const relative = (dir: string): string => path.relative('../../', dir);

export interface MapData {
    width: any;
    height: any;
    collisions: any[];
    version: number;

    lights?: any[];
    high?: any[];
    animated?: any;
    tilesets?: any[];
    animations?: any;
    data?: any[];
    depth?: number;
    objects?: any[];
    cursors?: any;
    trees?: any;
    treeIndexes?: any[];
    rocks?: any;
    rockIndexes?: any[];
    pvpAreas?: any[];
    gameAreas?: any[];
    doors?: any;
    musicAreas?: any[];
    staticEntities?: any;
    chestAreas?: any[];
    chests?: any[];
    overlayAreas?: any[];
    cameraAreas?: any[];
    tilewidth?: number;
    achievementAreas?: any[];
    plateau?: any;
    warps?: any;
    tilesize?: any;
    layers?: any[];
}

class ExportMap {
    source: string;

    constructor() {
        this.source = process.argv[2];

        if (!this.source) this.source = 'data/map-refactor.json';

        fs.exists(this.source, (exists) => {
            if (!exists) {
                console.log(`The file ${this.source} could not be found.`);
                return;
            }

            fs.readFile(this.source, (error, file) => {
                if (error) throw error;
                this.handleMap(JSON.parse(file.toString()));
            });
        });
    }

    handleMap(data) {
        const worldClientJSON = '../../server/data/map/world_client.json',
            worldServerJSON = '../../server/data/map/world_server.json',
            clientMapJSON = '../../client/data/maps/map.json';

        const worldClient = this.parse(data, worldClientJSON, 'client');

        this.parse(data, worldServerJSON, 'server');
        this.parse(data, clientMapJSON, 'info', worldClient);

        this.copyTilesets();
    }

    parse(data: MapData, destination: string, mode: string, worldClient?: MapData): MapData {
        const map = new ProcessMap(data, { mode: mode }).parse();

        if (worldClient) map.depth = worldClient.depth;

        const mapString = JSON.stringify(map);

        fs.writeFile(destination, mapString, (error) => {
            if (error) throw 'An error has occurred while writing map files.';
            else console.log(`[${_.startCase(mode)}] Map saved at: ${relative(destination)}`);
        });

        return map;
    }

    copyTilesets() {
        const source = './data',
            destination = '../../client/img/tilesets';

        fs.readdir(source, (error, files) => {
            if (error) {
                console.log('Could not copy the tilesets...');
                return;
            }

            _.each(files, (file) => {
                if (file.startsWith('tilesheet-'))
                    fs.copyFileSync(`${source}/${file}`, `${destination}/${file}`);
            });

            console.log(`Finished copying tilesets to ${relative(destination)}/`);
        });
    }
}

// String.prototype.format = function () {
//     return this.charAt(0).toUpperCase() + this.slice(1);
// };

// String.prototype.startsWith = function (str) {
//     return str.length > 0 && this.substring(0, str.length) === str;
// };

module.exports = ExportMap;

new ExportMap();
