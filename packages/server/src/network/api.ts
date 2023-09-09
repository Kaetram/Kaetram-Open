import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import axios from 'axios';
import express from 'express';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import type { Integration } from '@sentry/types';
import type { Router, Express } from 'express';
import type World from '../game/world';

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
        let apiEnabled = config.apiEnabled || config.hubEnabled,
            app: Express | undefined,
            router: Router | undefined;

        // API must be initialized if the hub is enabled.
        if (apiEnabled) {
            app = express();

            if (config.sentryDsn)
                app.use(Sentry.Handlers.requestHandler())
                    .use(Sentry.Handlers.tracingHandler())
                    .use(Sentry.Handlers.errorHandler());

            app.use(express.urlencoded({ extended: true })).use(express.json());

            router = express.Router();

            this.handleRouter(router);

            app.use('/', router).listen(config.apiPort, () => {
                log.notice(`${config.name} API has successfully initialized.`);
            });
        }

        if (!config.sentryDsn) return;

        let integrations: Integration[] = [new Sentry.Integrations.Http({ tracing: true })];

        if (app && router) integrations.push(new Tracing.Integrations.Express({ app, router }));

        Sentry.init({
            dsn: config.sentryDsn,
            integrations,
            tracesSampleRate: 1
        });
    }

    /**
     * Default routing for the server API. We just display some basic infomration
     * about the server, such as the name, port, game version, and the amount of
     * players currently online.
     * @param router Router for endpoints.
     */

    private handleRouter(router: express.Router): void {
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
