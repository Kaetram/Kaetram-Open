import config from '@kaetram/common/config';
import { Modules } from '@kaetram/common/network';
import { FriendInfo } from '@kaetram/common/types/friends';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import axios from 'axios';
import express from 'express';

import type Player from '../game/entity/character/player/player';
import type World from '../game/world';

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
                port: config.port, // Sends the server port.
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: this.world.getPopulation()
            });
        });

        router.post('/player', this.handlePlayer.bind(this));
        router.post('/chat', this.handleChat.bind(this));
        router.post('/players', this.handlePlayers.bind(this));
        router.post('/login', this.handleLogin.bind(this));
        router.post('/logout', this.handleLogout.bind(this));
    }

    private handlePlayer(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;
    }

    /**
     * Receives a chat request from the hub. We use this to send messages between
     * servers. The message from one server is sent to the hub, then the hub relays
     * that information to the other server.
     * @param request Contains information about the message.
     * @param response The response we give to the hub.
     */

    private handleChat(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        let { source, text, colour, target } = request.body;

        if (target) {
            let player = this.world.getPlayerByName(target);

            if (!player) return log.warning(`[handleChat] Player ${target} not found.`);

            player.sendMessage(target, text, source);
        } else this.world.globalMessage(source, Utils.parseMessage(text), colour, true);

        response.json({ status: 'success' });
    }

    /**
     * Grabs all the information about all the players (see `getPlayerData`) and then
     * sends a list of those players as per request.
     * @param request The request who is requesting the player data.
     * @param response The response to send the player data to.
     */

    private handlePlayers(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        let players: { [username: string]: Partial<PlayerData> } = {};

        this.world.entities.forEachPlayer((player: Player) => {
            players[player.username] = this.getPlayerData(player);
        });

        response.json(players);
    }

    /**
     * Signals that a player in another world has logged in. This is to sync up friends
     * list in this world with the player that just logged in.
     * @param request Contains the username of the player that just logged in.
     * @param response Generic response to the hub.
     */

    private handleLogin(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        let { username, serverId } = request.body;

        this.world.syncFriendsList(username, false, serverId);

        response.json({ status: 'success' });
    }

    /**
     * A logout is received by the server when a player on another server logs out.
     * We use this information to update the player's friends list status relative
     * to players on the current server.
     * @param request Contains the username of the player that just logged out.
     * @param response Generic response to the hub.
     */

    private handleLogout(request: express.Request, response: express.Response): void {
        if (!this.verifyToken(response, request.body.accessToken)) return;

        let { username } = request.body;

        this.world.syncFriendsList(username, true);

        response.json({ status: 'success' });
    }

    /**
     * A ping is a repeated message sent to the hub to constantly update the information
     * the hub has about the server. This contains information about the number of players
     * and connection information to the server. This ping is what signals to the hub
     * that the server is active. The first ping adds the server to the hub's list of
     * servers, while the subsequent pings update the information.
     */

    public async pingHub(): Promise<void> {
        let url = Utils.getUrl(config.hubHost, config.hubPort, 'ping'),
            data = {
                serverId: config.serverId,
                accessToken: config.accessToken,
                port: config.port,
                apiPort: config.apiPort,
                remoteServerHost: config.remoteServerHost,
                remoteApiHost: config.remoteApiHost || config.remoteServerHost,
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

    /**
     * When the hub is active, we send the in-game chats to the hub so that they're
     * sent to the Discord server. This is because the hub acts as the primary gateway
     * between the game and Discord.
     * @param source Who is sending the message.
     * @param text The contents of the message.
     * @param withArrow Whether to display an arrow between the source and content.
     */

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
        }
    }

    /**
     * Sends a request to the hub to privately message a player on another server.
     * This is used when the player is not on our server.
     * @param source The player object who is sending the message.
     * @param target The username of the player who is receiving the message.
     * @param text The contents of the message.
     */

    public async sendPrivateMessage(source: Player, target: string, text: string): Promise<void> {
        let url = Utils.getUrl(config.hubHost, config.hubPort, 'privateMessage'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId,
                source: source.username,
                target,
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

            source.notify(text, 'aquamarine', `[To ${Utils.formatName(target)}]`);
        }
    }

    /**
     * Takes the inactive friends that are deemed offline by the current server and sends
     * it to the hub to check if they are online on another server. If they are, the hub
     * will send a request to the current server with all the friends that are online and their
     * respective server information.
     * @param player The player we are linking the friends list for.
     * @param logout Determines whether we are logging out or not.
     */

    public async linkFriends(player: Player, logout = false): Promise<void> {
        let url = Utils.getUrl(config.hubHost, config.hubPort, 'friends'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId, // Server we are excluding from the search.
                username: player.username, // Username of the player we checking for
                inactiveFriends: logout ? [] : player.friends.getInactiveFriends(), // List of inactive friends.
                logout // Whether we are logging out or logging in.
            },
            response = await axios
                .post(url, data)
                .catch(() => log.error('Could not send linkFriends to hub.'));

        if (response) {
            let { data } = response;

            if (!data || logout || !data.activeFriends) return;

            player.friends.setActiveFriends(data.activeFriends);
        }
    }

    /**
     * Tells the hub that the player has logged in. This is used to update the hub's list of players.
     * @param username The username that has logged in.
     */

    public async sendLogin(username: string): Promise<void> {
        if (!config.hubEnabled) return;

        let url = Utils.getUrl(config.hubHost, config.hubPort, 'login'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId,
                username
            };

        axios.post(url, data).catch(() => log.error('Could not send `login` to hub.'));
    }

    /**
     * Tells the hub that the player has logged out.
     * @param username The username that has logged out.
     */

    public async sendLogout(username: string): Promise<void> {
        if (!config.hubEnabled) return;

        let url = Utils.getUrl(config.hubHost, config.hubPort, 'logout'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId,
                username
            };

        axios.post(url, data).catch(() => log.error('Could not send `logout` to hub.'));
    }

    /**
     * Checks whether the player is online on another server.
     * @param username The username of the player we are checking for.
     */

    public isPlayerOnline(username: string, callback: (online: boolean) => void): void {
        if (!config.hubEnabled) return callback(false);

        let url = Utils.getUrl(config.hubHost, config.hubPort, 'isOnline'),
            data = {
                hubAccessToken: config.hubAccessToken,
                serverId: config.serverId,
                username
            };

        axios
            .post(url, data)
            .then(({ data }) => callback(data.online))
            .catch(() => log.error('Could not send `isOnline` to hub.'));
    }

    /**
     * Checks whether or not the access token to communicate with the hub or
     * the server is valid.
     * @param response The response we are handling.
     * @param token The token string we are checking.
     * @returns Whether or not the token of the hub matches that of the server.
     */

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

    /**
     * The player data that will be returned as per request from the hub.
     * @param player The player we're getting the data from.
     * @returns A partial player data object containing information about the player.
     */

    private getPlayerData(player: Player): Partial<PlayerData> {
        if (!player) return {};

        return {
            serverId: config.serverId,
            x: player.x,
            y: player.y,
            level: player.level,
            pvpKills: player.statistics.pvpKills,
            orientation: player.orientation,
            lastLogin: player.statistics.lastLogin,
            mapVersion: player.mapVersion
        };
    }

    /**
     * Returns an error JSON object.
     * @param response The response we're... responding to (ba dum tss).
     * @param error The type of error that occurred.
     * @param message Extra information about the error.
     */

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
