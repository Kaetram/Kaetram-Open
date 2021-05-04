import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';
import _ from 'lodash';
import World from '../game/world';
import APIConstants from '../util/apiconstants';
import Utils from '../util/utils';
import Player from '../game/entity/character/player/player';
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

    handle(router: express.Router) {
        router.get('/', (_request: any, response: any) => {
            response.json({
                name: config.name,
                port: config.port, // Sends the server port.
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: this.world.getPopulation()
            });
        });

        router.post('/player', (request: any, response: any) => {
            this.handlePlayer(request, response);
        });

        router.post('/chat', (request: any, response: any) => {
            this.handleChat(request, response);
        });

        router.get('/players', (request: any, response: any) => {
            this.handlePlayers(request, response);
        });
    }

    handlePlayer(request: any, response: any) {
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

    handleChat(request: any, response: any) {
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

    handlePlayers(request: any, response: any) {
        if (!this.verifyToken(request.query.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /players GET request.'
            );
            return;
        }

        let players = {};

        this.world.entities.forEachPlayer((player: Player) => {
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
                    remoteServerHost: config.remoteServerHost
                }
            };

        request.post(url, data, (_error: any, _response: any, body: any) => {
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
                    withArrow: withArrow
                }
            };

        request.post(url, data, (_error: any, _response: any, body: any) => {
            try {
                let data = JSON.parse(body);

                if (data.status === 'error') console.log(data);

                //TODO - Do something with this?
            } catch (e) {
                log.error('Could not send message to hub.');
            }
        });
    }

    sendPrivateMessage(source: Player, target: string, text: string) {
        let url = this.getUrl('privateMessage'),
            data = {
                form: {
                    hubAccessToken: config.hubAccessToken,
                    source: Utils.formatUsername(source.username),
                    target: Utils.formatUsername(target),
                    text: text
                }
            };

        request.post(url, data, (_error: any, _response: any, body: any) => {
            try {
                let data = JSON.parse(body);

                if (data.error) {
                    source.notify(`Player @aquamarine@${target}@white@ is not online.`);
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

    verifyToken(token: string) {
        return token === config.accessToken;
    }

    getPlayerData(player: Player) {
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
            mapVersion: player.mapVersion
        };
    }

    getUrl(path: string) {
        return `http://${config.hubHost}:${config.hubPort}/${path}`;
    }

    returnError(response: any, error: any, message: string) {
        response.json({
            error: error,
            message: message
        });
    }
}

export default API;
