import cors from 'cors';
import express from 'express';
import mobs from '@kaetram/server/data/mobs.json';
import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';
import Stripe from 'stripe';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Cache from './cache';
import type Server from '../model/server';
import type Models from './models';
import type Mailer from './mailer';
import type { ObjectId } from 'mongodb';
import type { Integration } from '@sentry/types';
import type { Request, Response, Express, Router } from 'express';
import type {
    MobAggregate,
    PvpAggregate,
    SkillExperience,
    TotalExperience
} from '@kaetram/common/types/leaderboards';

// Initialize stripe
const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-08-16'
});

/**
 * We use the API format from `@kaetram/server`.
 */
export default class API {
    public constructor(
        private models: Models,
        private mailer: Mailer,
        private cache: Cache
    ) {
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

            app.use(express.urlencoded({ extended: true }), cors(), express.json());

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

    /**
     * The router is where we create all the API endpoints.
     * @param router The express router we are attaching the endpoints to.
     */

    private handleRouter(router: Router): void {
        // GET requests
        router.get('/', this.handleRoot.bind(this));
        router.get('/server', this.handleServer.bind(this));
        router.get('/all', this.handleAll.bind(this));
        router.get('/leaderboards', this.handleLeaderboards.bind(this));

        router.post('/isOnline', this.handleIsOnline.bind(this));
        router.post('/api/v1/requestReset', this.handleRequestReset.bind(this));
        router.post('/api/v1/resetPassword', this.handleResetPassword.bind(this));

        if (config.stripeEndpoint) {
            router.post(
                `/${config.stripeEndpoint}`,
                express.raw({ type: 'application/json' }),
                this.handleStripe.bind(this)
            );

            log.notice(`Stripe endpoint is enabled at /${config.stripeEndpoint}.`);
        }
    }

    /**
     * Handles the root origin of the API. This just serves
     * as a check to see if the Hub has initialized correctly.
     * @param _request Contains no information and is unused for now.
     * @param response Response with CORS headers attached returning a status.
     */

    private handleRoot(_request: Request, response: Response): void {
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
        if (!this.models.hasSpace()) {
            response.json({ status: 'error' });
            return;
        }

        let server = this.models.findEmptyServer();

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
        response.json(this.models.serializeServers());
    }

    /**
     * A GET response handing out total experience for the leaderboards. The cache prevents
     * us from having to query the database every time we need to update the leaderboards.
     * @param request Contains information about the type of data we are trying to extract.
     * @param response The response we are sending to the client.
     */

    private handleLeaderboards(request: Request, response: Response): void {
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
        this.models.forEachServer((server: Server) => {
            if (server.id === serverId) return;

            if (server.players.includes(username)) online = true;
        });

        response.json({
            status: 'success',
            online
        });
    }

    /**
     * Handles validation of incoming data, creating a password reset token,
     * and then sending it to the specified email address.
     * @param request Contains the email that we are sending the reset token to.
     * @param response The response we are sending back to the client.
     */

    private handleRequestReset(request: Request, response: Response): void {
        let { email } = request.body;

        // Verify the email address is valid.
        if (!email || !Utils.isEmail(email)) {
            response.json({ error: 'invalid' });
            return;
        }

        // Generate a reset token and send it to the email address.
        this.cache.database.createResetToken(email, (id?: ObjectId, token?: string) => {
            // We just return success to prevent brute-force attacks, better for the user to not know if the email exists or not.
            if (!id || !token) {
                response.json({ status: 'success' });
                return;
            }

            // Send the email to the user.
            this.mailer.send(
                email,
                'Kaetram Account Password Reset',
                `Hello there, you have requested a password reset for your account. Please use the following link to reset your password: https://kaetram.com/reset/?token=${token}&id=${id}`
            );

            // Send a response back to the client.
            response.json({ status: 'success' });
        });
    }

    /**
     * Handles the resetting of password. Verifies that the ID, token, and password
     * are valid and then updates the password in the database.
     * @param request Contains the body with the id, token, and password.
     * @param response Response that we send back to the client.
     */

    private handleResetPassword(request: Request, response: Response): void {
        let { id, token, password } = request.body;

        // Verify the token, id, and passwords are valid.
        if (!id || !token || !Utils.isValidPassword(password)) {
            response.json({ error: 'invalid' });
            return;
        }

        // Attempt to reset the password.
        this.cache.database.resetPassword(id, token, password, (status: boolean) => {
            response.json({ status: status ? 'success' : 'invalid' });
        });
    }

    /**
     * This is the webhook for Stripe payment processor. It's responsible
     * for in-app purchases and relaying the information to the appropriate
     * player should they be logged in on a world. If not, then we will look
     * through the database to grant them their purchase.
     * @param request Contains the headers and signatures from stripe.
     * @param response The response we are sending back to stripe.
     */

    private handleStripe(request: Request, response: Response): void {
        let signature = request.headers['stripe-signature'];

        // Send an empty response if we don't have a signature.
        if (!signature) {
            response.send();

            return log.warning('Stripe signature is missing from request.');
        }

        try {
            // Construct an event based on the request body and signature.
            let event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                config.stripeKeyLocal
            );

            // Handle events as needed.
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    let intentSuccess = event.data.object as Stripe.PaymentIntent;

                    console.log(intentSuccess);

                    // Relay information to the database/player here.
                    break;
                }

                default: {
                    log.warning(`Unhandled Stripe event: ${event.type}`);
                    break;
                }
            }
        } catch (error) {
            log.error(`Stripe webhook error: ${(error as Error).message}`);
            response.status(400).send(`Webhook Error: ${(error as Error).message}`);
            return;
        }

        response.send();
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
}
