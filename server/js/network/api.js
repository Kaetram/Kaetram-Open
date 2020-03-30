let express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    _ = require('underscore'),
    APIConstants = require('../util/apiconstants');

class API {

    /**
     * API will have a variety of uses. Including communication
     * between multiple worlds (planned for the future).
     *
     * `accessToken` - A randomly generated token that can be used
     * to verify the validity between the client and the server.
     * This is a rudimentary security method, but is enough considering
     * the simplicity of the current API.
     */

    constructor(world) {
        let self = this;

        self.world = world;

        if (!config.apiEnabled)
            return;

        let app = express();

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());

        let router = express.Router();

        self.handle(router);

        app.use('/', router);

        app.listen(config.apiPort, () => {
            log.info(config.name + ' API is now listening on: ' + config.apiPort);
        });

    }

    handle(router) {
        let self = this;

        router.get('/', (request, response) => {
            response.json({
                name: config.name,
                gameVersion: config.gver,
                maxPlayers: config.maxPlayers,
                playerCount: self.world.getPopulation()
            });
        });

        router.get('/players', (request, response) => {
            if (!request.query.token || request.query.token !== config.accessToken) {
                self.returnError(response, APIConstants.MALFORMED_PARAMETERS, 'Invalid `token` specified for /player GET request.');
                return;
            }

            let players = {};


            _.each(self.world.players, (player) => {
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


    pingHub() {
        let self = this,
            url = `http://${config.hubHost}:${config.hubPort}`,
            data = {
                form: {
                    serverId: config.serverId,
                    accessToken: config.accessToken
                }
            };

        request.post(url, data, (error, response, body) => {

            try {
                let data = JSON.parse(body);

                if (data.status === 'success') {
                    if (!self.hubConnected) {
                        log.notice('Connected to Kaetram Hub successfully!');
                        self.hubConnected = true;
                    }
                }

            } catch (e) {
                log.error('Could not connect to Kaetram Hub.');
                self.hubConnected = false;
            }

        });
    }

    returnError(response, error, message) {
        response.json({
            error: error,
            message: message
        });
    }

}

module.exports = API;
