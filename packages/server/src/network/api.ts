import axios from 'axios';
import express from 'express';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type Player from '../game/entity/character/player/player';
import type World from '../game/world';
import { Modules } from '@kaetram/common/network';

interface PlayerData {
    serverId: number;
    x: number;
    y: number;
    experience: number;
    level: number;
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
        // API must be initialized if the hub is enabled.
        if (!config.apiEnabled && !config.hubEnabled) return;

        let app = express();

        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());

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

        router.post('/player', this.handlePlayer.bind(this));
        router.post('/chat', this.handleChat.bind(this));
        router.post('/players', this.handlePlayers.bind(this));
    }

    private handlePlayer(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;
    }

    private handleChat(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        log.info(`[API] Server chat API not implemented.`);

        let { source, text, colour } = request.body;

        this.world.globalMessage(source, Utils.parseMessage(text), colour, true);

        response.json({ status: 'success' });
    }

    private handlePlayers(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        let players: { [username: string]: Partial<PlayerData> } = {};

        this.world.entities.forEachPlayer((player: Player) => {
            players[player.username] = this.getPlayerData(player);
        });

        response.json(players);
    }

    public async pingHub(): Promise<void> {
        let url = Utils.getUrl(config.hubHost, config.hubPort, 'ping'),
            data = {
                serverId: config.serverId,
                accessToken: config.accessToken,
                port: config.socketioPort,
                apiPort: config.apiPort,
                remoteServerHost: config.remoteServerHost,
                maxPlayers: config.maxPlayers,
                players: this.world.entities.getPlayerUsernames()
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

    public async sendChat(source: string, text: string, withArrow = true): Promise<void> {
        if (!config.hubEnabled) return;

        let url = Utils.getUrl(config.hubHost, config.hubPort, 'chat'),
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

            if (data.status === 'error') log.error(data);

            // TODO - Do something with this?
        }
    }

    public async sendPrivateMessage(source: Player, target: string, text: string): Promise<void> {
        let url = Utils.getUrl(config.hubHost, config.hubPort, 'privateMessage'),
            data = {
                hubAccessToken: config.hubAccessToken,
                source: Utils.formatName(source.username),
                target: Utils.formatName(target),
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

    private verifyToken(response: express.Response, token: string): boolean {
        let status = token === config.accessToken;

        if (!status)
            this.returnError(
                response,
                Modules.APIConstants.MALFORMED_PARAMETERS,
                'Invalid `accessToken` specified for /chat POST request.'
            );

        return status;
    }

    private getPlayerData(player: Player): Partial<PlayerData> {
        if (!player) return {};

        return {
            serverId: config.serverId,
            x: player.x,
            y: player.y,
            experience: player.experience,
            level: player.level,
            pvpKills: player.pvpKills,
            orientation: player.orientation,
            lastLogin: player.lastLogin,
            mapVersion: player.mapVersion
        };
    }

    private returnError(
        response: express.Response,
        error: Modules.APIConstants,
        message: string
    ): void {
        response.json({
            error,
            message
        });
    }
}
