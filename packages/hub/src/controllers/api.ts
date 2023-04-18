import express from 'express';
import mobs from '@kaetram/server/data/mobs.json';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import { Modules } from '@kaetram/common/network';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import type { Integration } from '@sentry/types';
import type Cache from './cache';
import type Server from '../model/server';
import type Servers from './servers';
import type Discord from '@kaetram/common/api/discord';
import type { Request, Response, Express, Router } from 'express';
import type {
    MobAggregate,
    PvpAggregate,
    SkillExperience,
    TotalExperience
} from '@kaetram/common/types/leaderboards';

/**
 * We use the API format from `@kaetram/server`.
 */
export default class API {
    public constructor(private servers: Servers, private discord: Discord, private cache: Cache) {
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

            app.use('/', router).listen(config.hubPort, () => {
                log.notice(`${config.name} hub API is now listening on ${config.hubPort}.`);
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

    private handleRouter(router: Router): void {
        // GET requests
        router.get('/', this.handleRoot.bind(this));
        router.get('/server', this.handleServer.bind(this));
        router.get('/all', this.handleAll.bind(this));
        router.get('/leaderboards', this.handleLeaderboards.bind(this));

        router.post('/isOnline', this.handleIsOnline.bind(this));
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

        if (!this.servers.hasSpace()) {
            response.json({ status: 'error' });
            return;
        }

        let server = this.servers.findEmpty();

        if (!server) {
            response.json({ status: 'error' });
            return;
        }

        response.json(server.serialize());
    }

    /**
     * Returns all the worlds currently online (without players).
     * @param _request Unused, contains no data.
     * @param response JSON data containing all the servers.
     */

    private handleAll(_request: Request, response: Response): void {
        this.setHeaders(response);

        response.json(this.servers.serialize());
    }

    /**
     * A GET response handing out total experience for the leaderboards. The cache prevents
     * us from having to query the database every time we need to update the leaderboards.
     * @param request Contains information about the type of data we are trying to extract.
     * @param response The response we are sending to the client.
     */

    private handleLeaderboards(request: Request, response: Response): void {
        this.setHeaders(response);

        if (request.query.skill) {
            let skillId = parseInt(request.query.skill as string);

            // Ensure the validity of the skill id we are trying to get.
            if (isNaN(skillId) || skillId < 0 || skillId > Object.keys(Modules.Skills).length / 2) {
                response.json({ error: 'invalid' });
                return;
            }

            // Get the skill experience from the cache.
            this.cache.getSkillsExperience(skillId, (data: SkillExperience[]) => {
                response.json({
                    status: 'success',
                    list: data
                });
            });

            return;
        }

        // Handles mob kills aggregation.
        if (request.query.mob) {
            let mobKey = request.query.mob as string;

            // Ensure that we are not being spammed with invalid mob keys.
            if (!mobKey || !(mobKey in mobs)) {
                response.json({ error: 'invalid' });
                return;
            }

            // Get the mob kills from the cache.
            this.cache.getMobKills(mobKey, (data: MobAggregate[]) => {
                response.json({
                    status: 'success',
                    list: data
                });
            });

            return;
        }

        // Handles pvp kills aggregation.
        if (request.query.pvp) {
            this.cache.getPvpData((data: PvpAggregate[]) => {
                response.json({
                    status: 'success',
                    list: data
                });
            });

            return;
        }

        this.cache.getTotalExperience((data: TotalExperience[]) => {
            response.json({
                status: 'success',
                list: data,
                availableMobs: this.cache.availableMobs
            });
        });
    }

    /**
     * Checks if the player is online in any of the servers.
     * @param request Contains the username of the player and the server we are checking from.
     * @param response Responds with a boolean indicating if the player is online anywhere else.
     */

    private handleIsOnline(request: Request, response: Response): void {
        if (!this.verifyRequest(request)) {
            response.json({ error: 'invalid' });
            return;
        }

        let { username, serverId } = request.body,
            online = false;

        // Look through all the servers and see if the player is online.
        this.servers.forEachServer((server: Server) => {
            if (server.id === serverId) return;

            if (server.players.includes(username)) online = true;
        });

        response.json({
            status: 'success',
            online
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
