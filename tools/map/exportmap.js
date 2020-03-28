#!/usr/bin/env node

config = { debugLevel: 'all' };

let Log = require('../../server/js/util/log'),
    fs = require("fs"),
    file = require('../file'),
    processMap = require('./processmap'),
    log = new Log(Log.DEBUG),
    source = process.argv[2];

function getMap() {
    if (!source)
        source = 'data/world.json';

    file.exists(source, function(exists) {
        if (!exists) {
            log.error('The file: ' + source + ' could not be found.');
            return;
        }

        fs.readFile(source, function(error, file) {
            onMap(JSON.parse(file.toString()));
        });
    });
}

function onMap(data) {
    let clientMap = parseClient(data, '../../server/data/map/world_client');

    parseServer(data, '../../server/data/map/world_server');
    parseInfo(data, '../../client/data/maps/map', clientMap);
}

function parseClient(data, destination) {
    let processedMap = processMap(data, { mode: 'client' }),
        map = JSON.stringify(processedMap);

    fs.writeFile(destination + '.json', map, function(err, file) {
        if (err)
            log.error(JSON.stringify(err));
        else
            log.info('[Client] Map saved at: ' + destination + '.json');
    });

    return processedMap;
}

function parseServer(data, destination) {
    let map = JSON.stringify(processMap(data, {
        mode: 'server'
    }));

    fs.writeFile(destination + '.json', map, function(err, file) {
        if (err)
            log.error(JSON.stringify(err));
        else
            log.info('[Server] Map saved at: ' + destination + '.json');
    });
}

function parseInfo(data, destination, clientMap) {
    let mapData = processMap(data, { mode: 'info' });

    if (clientMap)
        mapData.depth = clientMap.depth;

    let map = JSON.stringify(mapData);

    fs.writeFile(destination + '.json', map, function(err, file) {
        if (err)
            log.error(JSON.stringify(err));
        else
            log.info('[Client] Map saved at: ' + destination + '.json');
    });

    map = 'let mapData = ' + map;

    fs.writeFile(destination + '.js', map, function(err, file) {
        if (err)
            log.error(JSON.stringify(err));
        else
            log.info('[Client] Map saved at: ' + destination + '.js');
    });
}


getMap();
