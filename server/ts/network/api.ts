import express from 'express';
import bodyParser from 'body-parser';
import * as _ from 'underscore';
import config from '../../config';
import APIConstants from '../util/apiconstants';
import Player from '../game/entity/character/player/player';

/**
 * @param accessToken - A randomly generated token that can be used
 * to verify the validity between the client and the server.
 * This is a rudimentary security method, but is enough considering
 * the simplicity of the current API.
 */

/**
 * API will have a variety of uses. Including communication
 * between multiple worlds (planned for the future).
 *
 * @beta
 */
class API {
    public world: any;

    constructor(world) {
        this.world = world;

        const app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        const router = express.Router();

        this.handle(router);

        app.use('/', router);

        app.listen(config.apiPort, () => {
            console.info(
                `${config.name} API is now listening on: ${config.apiPort}`
            );
        });
    }

    handle(router) {
        router.get('/', (request, response) => {
            response.json({
                name: config.name,
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: this.world.getPopulation()
            });
        });

        router.get('/players', (request, response) => {
            if (
                !request.query.token ||
                request.query.token !== config.accessToken
            ) {
                this.returnError(
                    response,
                    APIConstants.MALFORMED_PARAMETERS,
                    'Invalid `token` specified for /player GET request.'
                );

                return;
            }

            const players = {};

            _.each(this.world.players, (player: Player) => {
                players[player.username] = {
                    x: player.x,
                    y: player.y,
                    experience: player.experience,
                    level: player.level,
                    hitPoints: player.hitPoints,
                    maxHitPoints: player.maxHitPoints,
                    mana: player.mana,
                    maxMana: player.maxMana,
                    pvpKills: player.pvpKills,
                    orientation: player.orientation,
                    lastLogin: player.lastLogin,
                    mapVersion: player.mapVersion
                };
            });

            response.json(players);
        });
    }

    returnError(response, error, message) {
        response.json({
            error,
            message
        });
    }
}

export default API;
