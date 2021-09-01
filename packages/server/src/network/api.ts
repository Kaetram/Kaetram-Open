import axios from 'axios';
import { json, urlencoded } from 'body-parser';
import express from 'express';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import APIConstants from '../util/apiconstants';

import type Player from '../game/entity/character/player/player';
import type Mana from '../game/entity/character/player/points/mana';
import type World from '../game/world';

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
    private hubConnected = false;

    public constructor(private world: World) {
        if (!config.apiEnabled) return;

        let app = express();

        app.use(urlencoded({ extended: true }));
        app.use(json());

        let router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.apiPort, () => {
            log.notice(`${config.name} API has successfully initialized.`);
        });
    }

    private handle(router: express.Router): void {
        router.get('/', (_request, response) => {
            response.json({
                name: config.name,
                port: config.socketioPort, // Sends the server port.
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

    private handlePlayer(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(request.body.accessToken)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /player POST request.'
            );
            return;
        }
    }

    private handleChat(request: express.Request, response: express.Response): void {
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
            { colour, username } = request.body;

        if (username) {
            let player = this.world.getPlayerByName(username);

            player?.chat(source, text, colour);

            response.json({ status: 'success' });

            return;
        }

        this.world.globalMessage(source, text, colour);

        response.json({ status: 'success' });
    }

    private handlePlayers(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(request.query.accessToken as string)) {
            this.returnError(
                response,
                APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /players GET request.'
            );
            return;
        }

        let players: { [username: string]: Partial<PlayerData> } = {};

        this.world.entities.forEachPlayer((player: Player) => {
            players[player.username] = this.getPlayerData(player);
        });

        response.json(players);
    }

    public async pingHub(): Promise<void> {
        let url = this.getUrl('ping'),
            data = {
                serverId: config.serverId,
                accessToken: config.accessToken,
                port: config.apiPort,
                remoteServerHost: config.remoteServerHost
            },
            response = await axios.post(url, data).catch(() => {
                log.error(`Could not connect to ${config.name} Hub.`);

                this.hubConnected = false;
            });

        if (response) {
            let { data } = response;

            if (data.status === 'success' && !this.hubConnected) {
                log.notice(`Connected to ${config.name} Hub successfully!`);

                this.hubConnected = true;
            }
        }
    }

    public async sendChat(source: string, text: string, withArrow = false): Promise<void> {
        let url = this.getUrl('chat'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId,
                source,
                text,
                withArrow
            },
            response = await axios
                .post(url, data)
                .catch(() => log.error('Could not send message to hub.'));

        if (response) {
            let { data } = response;

            if (data.status === 'error') console.log(data);

            // TODO - Do something with this?
        }
    }

    public async sendPrivateMessage(source: Player, target: string, text: string): Promise<void> {
        let url = this.getUrl('privateMessage'),
            data = {
                hubAccessToken: config.hubAccessToken,
                source: Utils.formatUsername(source.username),
                target: Utils.formatUsername(target),
                text
            },
            response = await axios
                .post(url, data)
                .catch(() => log.error('Could not send privateMessage to hub.'));

        if (response) {
            let { data } = response;

            if (data.error) {
                source.notify(`Player @aquamarine@${target}@white@ is not online.`);
                return;
            }
        }
    }

    private verifyToken(token: string): boolean {
        return token === config.accessToken;
    }

    private getPlayerData(player: Player): Partial<PlayerData> {
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

    private getUrl(path: string): string {
        return config.ssl
            ? `https://${config.hubHost}/${path}`
            : `http://${config.hubHost}:${config.hubPort}/${path}`;
    }

    private returnError(response: express.Response, error: APIConstants, message: string): void {
        response.json({
            error,
            message
        });
    }
}
