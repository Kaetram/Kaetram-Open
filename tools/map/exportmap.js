#!/usr/bin/env node

config = { debugLevel: 'all', debug: true };

let Log = require('../../server/js/util/log'),
    processMap = require('./processmap'),
    fs = require("fs");

log = new Log();

class ExportMap {

    constructor() {
        let self = this;

        self.source = process.argv[2];

        if (!self.source)
            self.source = 'data/map-refactor.json';

        fs.exists(self.source, (exists) => {
            if (!exists) {
                log.error(`The file ${source} could not be found.`);
                return;
            }

            fs.readFile(self.source, (error, file) => {
                self.handleMap(JSON.parse(file.toString()));
            });
        });
    }

    handleMap(data) {
        let self = this,
            worldClientJSON = '../../server/data/map/world_client.json',
            worldServerJSON = '../../server/data/map/world_server.json',
            clientMapJSON = '../../client/data/maps/map.json',
            clientMapJS = '../../client/data/maps/map.js';

        let worldClient = self.parse(data, worldClientJSON, 'client');

        self.parse(data, worldServerJSON, 'server');
        self.parse(data, clientMapJSON, 'info', worldClient);
        self.parse(data, clientMapJS, 'info', worldClient, true);
    }

    parse(data, destination, mode, worldClient, isJS) {
        let self = this,
            map = processMap(data, { mode: mode });

        if (worldClient)
            map.depth = worldClient.depth;

        let mapString = JSON.stringify(map);

        if (isJS)
            mapString = 'let mapData = ' + mapString;

        fs.writeFile(destination, mapString, (error, file) => {
            if (error)
                log.error(`An error has occurred while writing map files.`);
            else
                log.notice(`[${mode.format()}] Map saved at: ${destination}`);
        });

        return map;
    }

}

String.prototype.format = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

module.exports = ExportMap;

new ExportMap();
