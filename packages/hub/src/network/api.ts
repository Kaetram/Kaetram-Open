import axios from 'axios';
import { json, urlencoded } from 'body-parser';
import express from 'express';

import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import { formatServerName } from '../util/utils';

import type { APIData } from '@kaetram/common/types/api';
import type Servers from '../controllers/servers';
import type { Server } from '../controllers/servers';
import type Discord from './discord';

/**
 * We use the API format from `@kaetram/server`.
 */
export default class API {
    private discord!: Discord;

    public constructor(private serversController: Servers) {
        let app = express();

        app.use(urlencoded({ extended: true }));
        app.use(json());

        let router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.hubPort, () => {
            log.info(`${config.name} Hub API is now listening on ${config.hubPort}.`);
        });
    }

    private handle(router: express.Router): void {
        router.get('/', (_request, response) => {
            response.json({
                status: `${config.name} Hub is functional.`
            });
        });

        router.get('/server', (_request, response) => {
            this.findEmptyServer((result) => {
                this.setHeaders(response);

                response.json(result);
            });
        });

        router.get('/all', (_request, response) => {
            this.getServers((data) => {
                this.setHeaders(response);

                response.json(data);
            });
        });

        router.post('/ping', (request, response) => {
            this.handlePing(request, response);
        });

        router.post('/chat', (request, response) => {
            this.handleChat(request, response);
        });

        router.post('/privateMessage', (request, response) => {
            this.handlePrivateMessage(request, response);
        });

        router.post('guild', (request, response) => {
            this.handleGuild(request, response);
        });
    }

    private handlePing(request: express.Request, response: express.Response): void {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        let mappedAddress = request.socket.remoteAddress!,
            [, host] = mappedAddress.split('::ffff:');

        // This is the host we use to connect the hub to the server API.
        request.body.host = host;

        this.serversController.addServer(request.body);

        response.json({
            status: 'success'
        });
    }

    private handleChat(request: express.Request, response: express.Response): void {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!this.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        let { serverId } = request.body;

        if (!serverId) {
            response.json({
                status: 'error',
                reason: 'No `serverId` has been specified.'
            });

            return;
        }

        let { source, text, withArrow } = request.body,
            serverName = formatServerName(serverId);

        this.discord.sendWebhook(source, text, serverName, withArrow);

        response.json({ status: 'success' });
    }

    private handlePrivateMessage(request: express.Request, response: express.Response): void {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!this.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        /**
         * From who we are receiving the text
         * Who we're sending the text to
         * The text
         */
        let { source, target, text } = request.body;

        this.searchForPlayer(target, (result) => {
            let server = this.serversController.servers[result.serverId];

            source = `[From ${source}]`;

            this.sendChat(server, result.serverId, source, text, 'aquamarine', target);
        });
    }

    private handleGuild(request: express.Request, response: express.Response): void {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        if (!this.verifyToken(request.body.hubAccessToken)) {
            response.json({
                status: 'error',
                reason: 'Invalid `hubAccessToken` specified.'
            });

            return;
        }

        console.log(request.body);
    }

    private sendChat(
        server: Server,
        key: string,
        source: string,
        text: string,
        colour: string,
        username?: string
    ): void {
        let url = this.getUrl(server, 'chat'),
            data = {
                accessToken: server.accessToken,
                text,
                source,
                colour,
                username
            };

        axios.post(url, data).catch(() => log.error(`Could not send chat to ${key}`));
    }

    public sendChatToPlayer(player: string, text: string, colour: string): void {
        this.searchForPlayer(
            player,
            (server, key) => {
                if (!server) {
                    log.error(`Could not find ${player}.`);
                    return;
                }

                this.sendChat(server, key, player, text, colour);
            },
            true
        );
    }

    private async getServer(server: Server): Promise<APIData | undefined> {
        let url = this.getUrl(server, ''),
            response = await axios.get<APIData>(url).catch(() => {
                throw 'Could not connect to server.';
            });

        if (response) {
            let { data } = response;

            data.host = server.remoteServerHost || server.host;

            if (data.playerCount < data.maxPlayers) return data;

            throw 'World is full';
        }
    }

    private async getPlayer(username: string, server: Server): Promise<unknown> {
        let url = this.getUrl(server, 'player'),
            data = {
                accessToken: server.accessToken,
                username
            },
            response = await axios
                .post(url, data)
                .catch(() => log.error('An error has occurred while getting player.'));

        if (response) {
            let { data } = response;

            if (data.error) throw data;

            return data;
        }
    }

    public broadcastChat(source: string, text: string, colour: string): void {
        this.serversController.forEachServer((server, key) => {
            this.sendChat(server, key, source, text, colour);
        });
    }

    public async searchForPlayer(
        username: string,
        callback: (server: Server, key: string) => void,
        returnServer = false
    ): Promise<void> {
        let serverList = this.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                this.getPlayer(username, server);

                if (returnServer) callback(server, key);
                // else callback(result);

                return;
            } catch {
                //
            }
        }

        throw 'Could not find player in any of the worlds.';
    }

    public async findEmptyServer(callback: (result: APIData | undefined) => void): Promise<void> {
        let serverList = this.serversController.servers;

        for (let key in serverList) {
            let server = serverList[key];

            try {
                let result = await this.getServer(server);

                callback(result);

                return;
            } catch (error) {
                log.error(error);
            }
        }

        throw 'All servers are full.';
    }

    private async getServers(callback: (serverData: APIData[]) => void): Promise<void> {
        let serverList = this.serversController.servers,
            serverData: APIData[] = [];

        for (let key in serverList) {
            let server = serverList[key],
                result = await this.getServer(server).catch((error) => log.error(error));

            if (result)
                serverData.push({
                    serverId: key,
                    host: result.host,
                    port: result.port,
                    gameVersion: result.gameVersion,
                    playerCount: result.playerCount,
                    maxPlayers: result.maxPlayers
                });
        }

        callback(serverData);
    }

    private verifyToken(hubAccessToken: string): boolean {
        return hubAccessToken === config.hubAccessToken;
    }

    private getUrl(server: Server, path: string): string {
        return config.ssl
            ? `https://${server.host}/${path}`
            : `http://${server.host}:${server.port}/${path}`;
    }

    public setDiscord(discord: Discord): void {
        if (!this.discord) this.discord = discord;
    }

    private setHeaders(response: express.Response): void {
        response.header('Access-Control-Allow-Origin', '*');
        response.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        );
    }
}
