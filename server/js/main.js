let fs = require("fs"),
    World = require('./game/world'),
    WebSocket = require('./network/websocket'),
    config = require('../config'),
    Log = require('log'),
    Parser = require('./util/parser'),
    Database = require('./database/database'),
    _ = require('underscore'),
    allowConnections = false, world;

log = new Log(config.worlds > 1 ? 'notice' : config.debugLevel, config.localDebug ? fs.createWriteStream('runtime.log') : null);

function main() {
    log.info('Initializing ' + config.name + ' game engine...');

    let webSocket = new WebSocket(config.host, config.port, config.gver),
        database = new Database(config.database),
        stdin = process.openStdin();

    webSocket.onConnect(function(connection) {
        if (allowConnections) {

            if (world.isFull()) {
                log.info('Worlds are all currently full. Closing connection.');

                connection.sendUTF8('full');
                connection.close();
            } else
                world.playerConnectCallback(connection);

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

        world = new World(webSocket, database.getDatabase());

        world.load(onWorldLoad);

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

                log.info(`There are a total of ${world.getPopulation()} player(s) logged in.`);

                break;

            case 'registered':

                world.database.registeredCount((count) => {
                    log.info(`There are ${count} users registered.`);
                });

                break;

            case 'deleteGuilds':

                worlds.database.deleteGuilds();

                break;

        }
    });

}

function onWorldLoad() {
    log.notice(`World has successfully been created.`);
    allowConnections = true;

    var host = config.host === '0.0.0.0' ? 'localhost' : config.host;
    log.notice('Connect locally via http://' + host + ':' + config.port);
}

function loadParser() {
    new Parser();
}

function initializeWorlds() {
    for (var worldId in worlds)
        if (worlds.hasOwnProperty(worldId))
            worlds[worldId].load(onWorldLoad);
}

function saveAll() {
    _.each(worlds, function(world) {
        world.saveAll();
    });

    var plural = worlds.length > 1;

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
