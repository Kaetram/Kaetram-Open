let World = require('./game/world'),
    WebSocket = require('./network/websocket'),
    config = require('../config'),
    Log = require('log'),
    Parser = require('./util/parser'),
    Database = require('./database/database'),
    _ = require('underscore'),
    worlds = [], allowConnections = false,
    worldsCreated = 0;

log = new Log(config.worlds > 1 ? 'notice' : config.debugLevel, config.localDebug ? fs.createWriteStream('runtime.log') : null);

function main() {
    log.info('Initializing ' + config.name + ' game engine...');

    let webSocket = new WebSocket(config.host, config.port, config.gver),
        database = new Database(config.database),
        stdin = process.openStdin();

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

    stdin.addListener('data', (data) => {
        let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
            type = message.charAt(0);

        if (type !== '/')
            return;

        let blocks = message.substring(1).split(' '),
            command = blocks.shift();

        if (!command)
            return;

        switch (command) {

            case 'players':
                let total = 0;

                _.each(worlds, (world) => {
                    total += world.playerCount;
                });

                log.info(`There are ${total} player(s) in ${worlds.length} world(s).`);

                break;

            case 'registered':

                worlds[0].database.registeredCount((count) => {
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

    let host = config.host === '0.0.0.0' ? 'localhost' : config.host;
    log.notice('Connect locally via http://' + host + ':' + config.port);
}

function loadParser() {
    new Parser();
}

function initializeWorlds() {
    for (let worldId in worlds)
        if (worlds.hasOwnProperty(worldId))
            worlds[worldId].load(onWorldLoad);
}

function getPopulations() {
    let counts = [];

    for (let index in worlds)
        if (worlds.hasOwnProperty(index))
            counts.push(worlds[index].getPopulation());

    return counts;
}

function saveAll() {
    _.each(worlds, function(world) {
        world.saveAll();
    });

    let plural = worlds.length > 1;

    log.notice('Saved players for ' + worlds.length + ' world' + (plural ? 's' : '') + '.');
}

if ( typeof String.prototype.startsWith !== 'function' ) {
    String.prototype.startsWith = function(str) {
        return str.length > 0 && this.substring( 0, str.length ) === str;
    };
}

if ( typeof String.prototype.endsWith !== 'function' ) {
    String.prototype.endsWith = function(str) {
        return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
    };
}

main();
