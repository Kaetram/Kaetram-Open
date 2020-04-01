let express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    _ = require('underscore'),
    APIConstants = require('../util/apiconstants'),
    Utils = require('../util/utils');

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
            log.notice(config.name + ' API has successfully initialized.');
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

		router.post('/player', (request, response) => {
			self.handlePlayer(request, response);
		});

        router.post('/chat', (request, response) => {
            self.handleChat(request, response);
        });

        router.get('/players', (request, response) => {
			self.handlePlayers(request, response);
		});
    }

	handlePlayer(request, response) {
		let self = this;

        if (!request.body.token || request.body.token !== config.accessToken) {
            self.returnError(response, APIConstants.MALFORMED_PARAMETERS, 'Invalid `token` specified for /player POST request.');
            return;
        }

        let playerName = request.body.playerName;

        if (!playerName) {
            self.returnError(response, APIConstants.MALFORMED_PARAMETERS, 'No `playerName` variable received.');
            return;
        }

        if (!self.world.isOnline(playerName)) {
            self.returnError(response, APIConstants.PLAYER_NOT_ONLINE, `Player ${playerName} is not online.`);
            return;
        }

        let player = self.world.getPlayerByName(playerName);

        response.json(self.getPlayerData(player));
	}

    handleChat(request, response) {
        let self = this;

        if (!request.body.token || request.body.token !== config.accessToken) {
            self.returnError(response, APIConstants.MALFORMED_PARAMETERS, 'Invalid `token` specified for /chat POST request.');
            return;
        }

        let message = Utils.parseMessage(request.body.message),
            source = Utils.parseMessage(request.body.source),
            colour = request.body.colour;

        self.world.globalMessage(source, message, colour);

        response.json({ status: 'success' });
    }

	handlePlayers(request, response) {
		let self = this;

		if (!request.query.token || request.query.token !== config.accessToken) {
			self.returnError(response, APIConstants.MALFORMED_PARAMETERS, 'Invalid `token` specified for /players GET request.');
			return;
		}

		let players = {};

		_.each(self.world.players, (player) => {
			players[player.username] = self.getPlayerData(player);
		});

		response.json(players);
	}

    pingHub() {
        let self = this,
            url = `http://${config.hubHost}:${config.hubPort}/ping`,
            data = {
                form: {
                    serverId: config.serverId,
                    accessToken: config.accessToken,
                    port: config.apiPort
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

    getPlayerData(player) {
        let self = this;

        if (!player)
            return {};

        return {
            serverId: config.serverId,
            x: player.x,
            y: player.y,
            experience: player.experience,
            level: player.level,
            hitPoints: player.hitPoints,
            mana: player.mana,
            pvpKills: player.pvpKills,
            orientation: player.orientation,
            lastLogin: player.lastLogin,
            mapVersion: player.mapVersion
        };
    }

    returnError(response, error, message) {
        response.json({
            error: error,
            message: message
        });
    }

}

module.exports = API;
