import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import axios from 'axios';
import express, { Router } from 'express';

import type Discord from '@kaetram/common/api/discord';
import type { Request, Response } from 'express';
import type Servers from './controllers/servers';
import type Server from './model/server';

/**
 * We use the API format from `@kaetram/server`.
 */
export default class API {
    public constructor(private servers: Servers, private discord: Discord) {
        let app = express();

        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());

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
        router.post('/chat', this.handleChat.bind(this));
        router.post('/privateMessage', this.handlePrivateMessage.bind(this));
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
            response.json(server.serialize());
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
     * Handles a chat message received from a server.
     * @param request Request containing server data.
     * @param response Response indicating success or error.
     */

    private handleChat(request: Request, response: Response): void {
        if (!this.verifyRequest(request)) {
            response.json({ status: 'error' });
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
            serverName = `${config.name} ${serverId}`;

        this.discord.sendMessage(source, text, serverName, withArrow);

        response.json({ status: 'success' });
    }

    /**
     * Handles when a private message is received and if the target is online,
     * @param request Request containing the sender, target, and message information.
     * @param response Contains information about the success or failure of the request.
     */

    private handlePrivateMessage(request: Request, response: Response): void {
        if (!this.verifyRequest(request)) {
            response.json({ status: 'error' });
            return;
        }

        /**
         * From who we are receiving the text
         * Who we're sending the text to
         * The text
         */
        let { source, target, text } = request.body,
            server = this.servers.findPlayer(target);

        if (!server) {
            response.json({ status: 'error' });
            return;
        }

        source = `[From ${source}]`;

        this.sendChat(server, source, text, 'aquamarine', target);
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
     * Sends a global chat to a given server.
     * @param server Server we are sending the chat to.
     * @param source Who is sending the message.
     * @param text The contents of the message.
     * @param colour The colour of the messsage.
     */

    private sendChat(
        server: Server,
        key: string,
        source: string,
        text: string,
        colour: string
    ): void {
        let url = Utils.getUrl(server.host, server.apiPort, 'chat', true),
            data = {
                accessToken: server.accessToken,
                text,
                source,
                colour
            };

        axios.post(url, data).catch((error) => {
            log.error(`Could not send chat to ${config.name} ${key}`);
            log.error(error);
        });
    }

    /**
     * Verifies the integrity of the request and if the tokens
     * are valid.
     * @param request Contains server information that we will verify.
     * @returns False if the request is invalid, true if it is valid.
     */

    private verifyRequest(request: Request): boolean {
        if (!request.body) return false;

        let { hubAccessToken, serverId } = request.body;

        if (!hubAccessToken || !serverId) return false;

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
