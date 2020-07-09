#!/usr/bin/env node

config = { debugLevel: 'all', debug: true };

let processMap = require('./processmap'),
    fs = require('fs');
_ = require('underscore');

class ExportMap {
    constructor() {
        let self = this;

        self.source = process.argv[2];

        if (!self.source) self.source = 'data/map-refactor.json';

        fs.exists(self.source, (exists) => {
            if (!exists) {
                console.log(`The file ${source} could not be found.`);
                return;
            }

            fs.readFile(self.source, (error, file) => {
                self.handleMap(JSON.parse(file.toString()));
            });
        });
    }

    handleMap(data) {
        let self = this,
            worldClientJSON = '../../packages/server/data/map/world_client.json',
            worldServerJSON = '../../packages/server/data/map/world_server.json',
            clientMapJSON = '../../packages/client/data/maps/map.json',
            clientMapJS = '../../packages/client/data/maps/map.js';

        let worldClient = self.parse(data, worldClientJSON, 'client');

        self.parse(data, worldServerJSON, 'server');
        self.parse(data, clientMapJSON, 'info', worldClient);
        self.parse(data, clientMapJS, 'info', worldClient, true);

        self.copyTilesets();
    }

    parse(data, destination, mode, worldClient, isJS) {
        let self = this,
            map = processMap(data, { mode: mode });

        if (worldClient) map.depth = worldClient.depth;

        let mapString = JSON.stringify(map);

        if (isJS) mapString = 'let mapData = ' + mapString;

        fs.writeFile(destination, mapString, (error, file) => {
            if (error) console.log(`An error has occurred while writing map files.`);
            else console.log(`[${mode.format()}] Map saved at: ${destination}`);
        });

        return map;
    }

    copyTilesets() {
        let self = this,
            source = './data',
            destination = '../../packages/client/img/tilesets';

        fs.readdir(source, (error, files) => {
            if (error) {
                console.log('Could not copy the tilesets...');
                return;
            }

            _.each(files, (file) => {
                if (file.startsWith('tilesheet-'))
                    fs.copyFileSync(`${source}/${file}`, `${destination}/${file}`);
            });

            console.log(`Finished copying tilesets to ${destination}/`);
        });
    }
}

String.prototype.format = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.startsWith = function(str) {
    return str.length > 0 && this.substring(0, str.length) === str;
};

module.exports = ExportMap;

new ExportMap();
