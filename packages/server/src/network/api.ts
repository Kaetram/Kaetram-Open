import express from 'express';
import { urlencoded, json } from 'body-parser';
import axios from 'axios';
import World from '../game/world';
import APIConstants from '../util/apiconstants';
import Utils from '../util/utils';
import Player from '../game/entity/character/player/player';
import config from '../../config';
import log from '../util/log';
import type Mana from '../game/entity/character/player/points/mana';

interface PlayerData {
    serverId: string;
    x: number;
    y: number;
    experience: number;
    level: number;
    hitPoints: number;
    mana: Mana;
    pvpKills: number;
    orientation: number;
    lastLogin: number;
    mapVersion: number;
}

/**
 * API will have a variety of uses. Including communication
 * between multiple worlds (planned for the future).
 *
 * `accessToken` - A randomly generated token that can be used
 * to verify the validity between the client and the server.
 * This is a rudimentary security method, but is enough considering
 * the simplicity of the current API.
 */
export default class API {
    world: World;
    hubConnected = false;

    constructor(world: World) {
        this.world = world;

        if (!config.apiEnabled) return;

        const app = express();

        app.use(urlencoded({ extended: true }));
        app.use(json());

        const router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.apiPort, () => {
            log.notice(`${config.name} API has successfully initialized.`);
        });
    }

    handle(router: express.Router): void {
        router.get('/', (_request, response) => {
            response.json({
                name: config.name,
                port: config.apiPort, // Sends the server port.
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: this.world.getPopulation()
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

    handlePlayer(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(request.body.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /player POST request.'
            );
            return;
        }
    }

    handleChat(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(request.body.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /chat POST request.'
            );
            return;
        }

        const text = Utils.parseMessage(request.body.text),
            source = Utils.parseMessage(request.body.source),
            { colour, username } = request.body;

        if (username) {
            const player = this.world.getPlayerByName(username);

            player?.chat(source, text, colour);

            response.json({ status: 'success' });

            return;
        }

        this.world.globalMessage(source, text, colour);

        response.json({ status: 'success' });
    }

    handlePlayers(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(request.query.accessToken as string)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /players GET request.'
            );
            return;
        }

        const players: { [username: string]: Partial<PlayerData> } = {};

        this.world.entities.forEachPlayer((player: Player) => {
            players[player.username] = this.getPlayerData(player);
        });

        response.json(players);
    }

    async pingHub(): Promise<void> {
        const url = this.getUrl('ping'),
            data = {
                form: {
                    serverId: config.serverId,
                    accessToken: config.accessToken,
                    port: config.apiPort,
                    remoteServerHost: config.remoteServerHost
                }
            },
            res = await axios.post(url, data);

        try {
            const data = JSON.parse(res.data);

            if (data.status === 'success' && !this.hubConnected) {
                log.notice('Connected to Kaetram Hub successfully!');
                this.hubConnected = true;
            }
        } catch {
            log.error('Could not connect to Kaetram Hub.');
            this.hubConnected = false;
        }
    }

    async sendChat(source: string, text: string, withArrow?: boolean): Promise<void> {
        const url = this.getUrl('chat'),
            data = {
                form: {
                    hubAccessToken: config.hubAccessToken,
                    serverId: config.serverId,
                    source,
                    text,
                    withArrow
                }
            },
            res = await axios.post(url, data);

        try {
            const data = JSON.parse(res.data);

            if (data.status === 'error') console.log(data);

            // TODO - Do something with this?
        } catch {
            log.error('Could not send message to hub.');
        }
    }

    async sendPrivateMessage(source: Player, target: string, text: string): Promise<void> {
        const url = this.getUrl('privateMessage'),
            data = {
                form: {
                    hubAccessToken: config.hubAccessToken,
                    source: Utils.formatUsername(source.username),
                    target: Utils.formatUsername(target),
                    text
                }
            },
            res = await axios.post(url, data);

        try {
            const data = JSON.parse(res.data);

            if (data.error) {
                source.notify(`Player @aquamarine@${target}@white@ is not online.`);
                return;
            }
        } catch {
            log.error('Could not send privateMessage to hub.');
        }
    }

    verifyToken(token: string): boolean {
        return token === config.accessToken;
    }

    getPlayerData(player: Player): Partial<PlayerData> {
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

    getUrl(path: string): string {
        return `http://${config.hubHost}:${config.hubPort}/${path}`;
    }

    returnError(response: express.Response, error: APIConstants, message: string): void {
        response.json({
            error,
            message
        });
    }
}
