import axios from 'axios';
import { json, urlencoded } from 'body-parser';
import express, { Router, Request, Response } from 'express';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';
import type { APIData } from '@kaetram/common/types/api';

import type Servers from './controllers/servers';
import type { Server } from './controllers/servers';

/**
 * We use the API format from `@kaetram/server`.
 */
export default class API {
    public constructor(private servers: Servers, private discord: Discord) {
        let app = express();

        app.use(urlencoded({ extended: true }));
        app.use(json());

        let router = Router();

        this.handle(router);

        app.use('/', router);

        // Listen with the hub port.
        app.listen(config.hubPort, () => {
            log.info(`${config.name} Hub API is now listening on ${config.hubPort}.`);
        });
    }

    private handle(router: Router): void {
        // GET requests
        router.get('/', this.handleRoot.bind(this));
        router.get('/server', this.handleServer.bind(this));
        router.get('/all', this.handleAll.bind(this));

        // POST requests
        router.post('/ping', this.handlePing.bind(this));

        // router.get('/server', (_request, response) => {
        //     this.findEmptyServer((result) => {
        //         this.setHeaders(response);

        //         response.json(result);
        //     });
        // });

        // router.get('/all', (_request, response) => {
        //     this.getServers((data) => {
        //         this.setHeaders(response);

        //         response.json(data);
        //     });
        // });

        // router.post('/ping', (request, response) => {
        //     this.handlePing(request, response);
        // });

        // router.post('/chat', (request, response) => {
        //     this.handleChat(request, response);
        // });

        // router.post('/privateMessage', (request, response) => {
        //     this.handlePrivateMessage(request, response);
        // });

        // router.post('guild', (request, response) => {
        //     this.handleGuild(request, response);
        // });
    }

    /**
     * Handles the root origin of the API. This just serves
     * as a check to see if the Hub has initialized correctly.
     * @param _request Contains no information and is unused for now.
     * @param response Response with CORS headers attached returning a status.
     */

    private handleRoot(_request: Request, response: Response): void {
        this.setHeaders(response);

        response.json({ status: `${config.name} hub is online and functional.` });
    }

    /**
     * Handles a GET API request to grab an empty server from our list.
     * We iterate through the servers and find the first server that
     * has space for a player to join.
     * @param _request Unused, contains no data.
     * @param response Server APIData object if found.
     */

    private handleServer(_request: Request, response: Response): void {
        this.setHeaders(response);

        if (!this.servers.hasEmpty()) {
            response.json({ status: 'error' });
            return;
        }

        this.servers.findEmpty((server: Server) => {
            response.json(server);
        });
    }

    /**
     * Returns all the worlds currently online (without players).
     * @param _request Unused, contains no data.
     * @param response JSON data containing all the servers.
     */

    private handleAll(_request: Request, response: Response): void {
        this.setHeaders(response);

        response.json(this.servers.getAll());
    }

    /**
     * Handles a ping from a server. Stores the data that we receive
     * and/or updates currently existing data in our`servers` list.
     * @param request Information about the server.
     * @param response Response being sent back to the server.
     */

    private handlePing(request: Request, response: Response): void {
        if (!request.body) {
            response.json({ status: 'error' });
            return;
        }

        // Extract the IPv6 address from the socket.
        let mappedAddress = request.socket.remoteAddress!,
            [, host] = mappedAddress.split('::ffff:');

        // This is the host we use to connect the hub to the server API.
        request.body.host = host;

        this.servers.add(request.body);

        response.json({
            status: 'success'
        });
    }

    /**
     * Broadcasts a piece of chat (usually from the Discord server)
     * to all the servers currently connected.
     * @param source Who is sending the message.
     * @param text The contents of the message.
     * @param colour The colour of the message.
     */

    public broadcastChat(source: string, text: string, colour: string): void {
        this.servers.forEachServer((server, key) => {
            this.sendChat(server, key, source, text, colour);
        });
    }

    /**
     * Sends a chat to a given server.
     * @param server Server we are sending the chat to.
     * @param key The server key (the server id).
     * @param source Who is sending the message.
     * @param text The contents of the message.
     * @param colour The colour of the messsage.
     * @param username Username of the player sending the message.
     */

    private sendChat(
        server: Server,
        key: string,
        source: string,
        text: string,
        colour: string,
        username?: string
    ): void {
        let url = Utils.getUrl(server.host, server.port, 'chat'),
            data = {
                accessToken: server.accessToken,
                text,
                source,
                colour,
                username
            };

        axios
            .post(url, data)
            .catch(() => log.error(`Could not send chat to ${config.name} ${key}`));
    }

    // private handleChat(request: Request, response: Response): void {
    //     if (!request.body) {
    //         response.json({ status: 'error' });
    //         return;
    //     }

    //     if (!this.verifyToken(request.body.hubAccessToken)) {
    //         response.json({
    //             status: 'error',
    //             reason: 'Invalid `hubAccessToken` specified.'
    //         });

    //         return;
    //     }

    //     let { serverId } = request.body;

    //     if (!serverId) {
    //         response.json({
    //             status: 'error',
    //             reason: 'No `serverId` has been specified.'
    //         });

    //         return;
    //     }

    //     let { source, text, withArrow } = request.body,
    //         serverName = `${config.name} ${serverId}`;

    //     this.discord.sendMessage(source, text, serverName, withArrow);

    //     response.json({ status: 'success' });
    // }

    // private handlePrivateMessage(request: Request, response: Response): void {
    //     if (!request.body) {
    //         response.json({ status: 'error' });
    //         return;
    //     }

    //     if (!this.verifyToken(request.body.hubAccessToken)) {
    //         response.json({
    //             status: 'error',
    //             reason: 'Invalid `hubAccessToken` specified.'
    //         });

    //         return;
    //     }

    //     /**
    //      * From who we are receiving the text
    //      * Who we're sending the text to
    //      * The text
    //      */
    //     let { source, target, text } = request.body;

    //     this.searchForPlayer(target, (result) => {
    //         let server = this.servers.get(result.serverId);

    //         source = `[From ${source}]`;

    //         this.sendChat(server, result.serverId, source, text, 'aquamarine', target);
    //     });
    // }

    // private handleGuild(request: Request, response: Response): void {
    //     if (!request.body) {
    //         response.json({ status: 'error' });
    //         return;
    //     }

    //     if (!this.verifyToken(request.body.hubAccessToken)) {
    //         response.json({
    //             status: 'error',
    //             reason: 'Invalid `hubAccessToken` specified.'
    //         });

    //         return;
    //     }
    // }

    // public sendChatToPlayer(player: string, text: string, colour: string): void {
    //     this.searchForPlayer(
    //         player,
    //         (server, key) => {
    //             if (!server) {
    //                 log.error(`Could not find ${player}.`);
    //                 return;
    //             }

    //             this.sendChat(server, key, player, text, colour);
    //         },
    //         true
    //     );
    // }

    // private async getPlayer(username: string, server: Server): Promise<unknown> {
    //     let url = Utils.getUrl(server.host, server.port, 'player'),
    //         data = {
    //             accessToken: server.accessToken,
    //             username
    //         },
    //         response = await axios
    //             .post(url, data)
    //             .catch(() => log.error('An error has occurred while getting player.'));

    //     if (response) {
    //         let { data } = response;

    //         if (data.error) throw data;

    //         return data;
    //     }
    // }

    // public broadcastChat(source: string, text: string, colour: string): void {
    //     this.servers.forEachServer((server, key) => {
    //         this.sendChat(server, key, source, text, colour);
    //     });
    // }

    // public async searchForPlayer(
    //     username: string,
    //     callback: (server: Server, key: string) => void,
    //     returnServer = false
    // ): Promise<void> {
    //     let serverList = this.servers.servers;

    //     for (let key in serverList) {
    //         let server = serverList[key];

    //         try {
    //             this.getPlayer(username, server);

    //             if (returnServer) callback(server, key);
    //             // else callback(result);

    //             return;
    //         } catch {
    //             //
    //         }
    //     }

    //     throw 'Could not find player in any of the worlds.';
    // }

    private verifyToken(hubAccessToken: string): boolean {
        return hubAccessToken === config.hubAccessToken;
    }

    /**
     * Sets CORS headers on the response to prevent errors.
     * @param response Response to set headers on.
     */

    private setHeaders(response: Response): void {
        response.header('Access-Control-Allow-Origin', '*');
        response.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        );
    }
}
