import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as request from 'request';
import * as _ from 'underscore';
import World from '../game/world';
import APIConstants from '../util/apiconstants';
import Utils from '../util/utils';
import config from '../../config';
import log from '../util/log';

class API {
    /**
     * API will have a variety of uses. Including communication
     * between multiple worlds (planned for the future).
     *
     * `accessToken` - A randomly generated token that can be used
     * to verify the validity between the client and the server.
     * This is a rudimentary security method, but is enough considering
     * the simplicity of the current API.
     */

    world: World;
    hubConnected: boolean;

    constructor(world: World) {
        this.world = world;

        if (!config.apiEnabled) return;

        let app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        let router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.apiPort, () => {
            log.notice(config.name + ' API has successfully initialized.');
        });
    }

    handle(router) {
        router.get('/', (request, response) => {
            response.json({
                name: config.name,
                port: config.port, // Sends the server port.
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: this.world.getPopulation(),
            });
        });

        router.post('/player', (request, response) => {
            this.handlePlayer(request, response);
        });

        router.post('/chat', (request, response) => {
            this.handleChat(request, response);
        });

        router.get('/players', (request, response) => {
            this.handlePlayers(request, response);
        });
    }

    handlePlayer(request, response) {
        if (!this.verifyToken(request.body.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /player POST request.'
            );
            return;
        }

        let username = request.body.username;

        if (!username) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'No `username` variable received.'
            );
            return;
        }

        if (!this.world.isOnline(username)) {
            this.returnError(
                response,
                APIConstants.PLAYER_NOT_ONLINE,
                `Player ${username} is not online.`
            );
            return;
        }

        let player = this.world.getPlayerByName(username);

        response.json(this.getPlayerData(player));
    }

    handleChat(request, response) {
        if (!this.verifyToken(request.body.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /chat POST request.'
            );
            return;
        }

        let text = Utils.parseMessage(request.body.text),
            source = Utils.parseMessage(request.body.source),
            colour = request.body.colour,
            username = request.body.username;

        if (username) {
            let player = this.world.getPlayerByName(username);

            if (player) player.chat(source, text, colour);

            response.json({ status: 'success' });

            return;
        }

        this.world.globalMessage(source, text, colour);

        response.json({ status: 'success' });
    }

    handlePlayers(request, response) {
        if (!this.verifyToken(request.query.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /players GET request.'
            );
            return;
        }

        let players = {};

        _.each(this.world.players, (player) => {
            players[player.username] = this.getPlayerData(player);
        });

        response.json(players);
    }

    pingHub() {
        let url = this.getUrl('ping'),
            data = {
                form: {
                    serverId: config.serverId,
                    accessToken: config.accessToken,
                    port: config.apiPort,
                    remoteServerHost: config.remoteServerHost,
                },
            };

        request.post(url, data, (error, response, body) => {
            try {
                let data = JSON.parse(body);

                if (data.status === 'success') {
                    if (!this.hubConnected) {
                        log.notice('Connected to Kaetram Hub successfully!');
                        this.hubConnected = true;
                    }
                }
            } catch (e) {
                log.error('Could not connect to Kaetram Hub.');
                this.hubConnected = false;
            }
        });
    }

    sendChat(source: string, text: string, withArrow?: boolean) {
        let url = this.getUrl('chat'),
            data = {
                form: {
                    hubAccessToken: config.hubAccessToken,
                    serverId: config.serverId,
                    source: source,
                    text: text,
                    withArrow: withArrow,
                },
            };

        request.post(url, data, (error, response, body) => {
            try {
                let data = JSON.parse(body);

                if (data.status === 'error') console.log(data);

                //TODO - Do something with this?
            } catch (e) {
                log.error('Could not send message to hub.');
            }
        });
    }

    sendPrivateMessage(source, target, text) {
        let url = this.getUrl('privateMessage'),
            data = {
                form: {
                    hubAccessToken: config.hubAccessToken,
                    source: Utils.formatUsername(source.username),
                    target: Utils.formatUsername(target),
                    text: text,
                },
            };

        request.post(url, data, (error, response, body) => {
            try {
                let data = JSON.parse(body);

                if (data.error) {
                    source.notify(
                        `Player @aquamarine@${target}@white@ is not online.`
                    );
                    return;
                }

                // No error has occurred.

                // TODO - Add chat colours/format to config.
                source.chat(`[To ${target}]`, text, 'aquamarine');
            } catch (e) {
                log.error('Could not send privateMessage to hub.');
            }
        });
    }

    verifyToken(token) {
        return token === config.accessToken;
    }

    getPlayerData(player) {
        if (!player) return {};

        return {
            serverId: config.serverId,
            x: player.x,
            y: player.y,
            experience: player.experience,
            level: player.level,
            hitPoints: player.hitPoints,
            mana: player.mana,
            pvpKills: player.pvpKills,
            orientation: player.orientation,
            lastLogin: player.lastLogin,
            mapVersion: player.mapVersion,
        };
    }

    getUrl(path) {
        return `http://${config.hubHost}:${config.hubPort}/${path}`;
    }

    returnError(response, error, message) {
        response.json({
            error: error,
            message: message,
        });
    }
}

export default API;
