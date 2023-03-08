import config from '@kaetram/common/config';
import { Modules } from '@kaetram/common/network';
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

    /**
     * Default routing for the server API. We just display some basic infomration
     * about the server, such as the name, port, game version, and the amount of
     * players currently online.
     * @param router Router for endpoints.
     */

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
}
