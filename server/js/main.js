const World = require('./game/world');
const WebSocket = require('./network/websocket');
const config = require('../config');
const Log = require('log');
const Parser = require('./util/parser');
const Database = require('./database/database');
const _ = require('underscore');
const worlds = []; let allowConnections = false;
let worldsCreated = 0;

log = new Log(config.worlds > 1 ? 'notice' : config.debugLevel, config.localDebug ? fs.createWriteStream('runtime.log') : null);

function main() {
    log.info('Initializing ' + config.name + ' game engine...');

    const webSocket = new WebSocket(config.host, config.port, config.gver);
    const database = new Database(config.database);
    const stdin = process.openStdin();

    webSocket.onConnect(function(connection) {
        if (allowConnections) {
            let world;

            for (let i = 0; i < worlds.length; i++)
                if (worlds[i].playerCount < worlds[i].maxPlayers) {
                    world = worlds[i];
                    break;
                }

            if (world)
                world.playerConnectCallback(connection);
            else {
                log.info('Worlds are all currently full. Closing connection.');

                connection.sendUTF8('full');
                connection.close();
            }
        } else {
            connection.sendUTF8('disallowed');
            connection.close();
        }
    });


    webSocket.onWebSocketReady(function() {
        /**
         * Initialize the worlds after the webSocket finishes.
         */

        loadParser();

        for (let i = 0; i < config.worlds; i++)
            worlds.push(new World(i + 1, webSocket, database.getDatabase()));

        initializeWorlds();
    });

    stdin.addListener('data', data => {
        const message = data.toString().replace(/(\r\n|\n|\r)/gm, '');
        const type = message.charAt(0);

        if (type !== '/')
            return;

        const blocks = message.substring(1).split(' ');
        const command = blocks.shift();

        if (!command)
            return;

        switch (command) {
            case 'players':
                let total = 0;

                _.each(worlds, world => {
                    total += world.playerCount;
                });

                log.info(`There are ${total} player(s) in ${worlds.length} world(s).`);

                break;

            case 'registered':

                worlds[0].database.registeredCount(count => {
                    log.info(`There are ${count} users registered.`);
                });

                break;
        }
    });
}

function onWorldLoad() {
    worldsCreated++;
    if (worldsCreated === worlds.length)
        allWorldsCreated();
}

function allWorldsCreated() {
    log.notice('Finished creating ' + worlds.length + ' world' + (worlds.length > 1 ? 's' : '') + '!');
    allowConnections = true;

    const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
    log.notice('Connect locally via http://' + host + ':' + config.port);
}

function loadParser() {
    new Parser();
}

function initializeWorlds() {
    for (const worldId in worlds)
        if (worlds.hasOwnProperty(worldId))
            worlds[worldId].load(onWorldLoad);
}

function getPopulations() {
    const counts = [];

    for (const index in worlds)
        if (worlds.hasOwnProperty(index))
            counts.push(worlds[index].getPopulation());

    return counts;
}

function saveAll() {
    _.each(worlds, function(world) {
        world.saveAll();
    });

    const plural = worlds.length > 1;

    log.notice('Saved players for ' + worlds.length + ' world' + (plural ? 's' : '') + '.');
}

if (typeof String.prototype.startsWith !== 'function')
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring(0, str.length) === str;
    };


if (typeof String.prototype.endsWith !== 'function')
    String.prototype.endsWith = function(str) {
        return str.length > 0 && this.substring(this.length - str.length, this.length) === str;
    };


main();
