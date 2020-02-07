let config = require('../../config'),
    http = require('http'),
    Constants = require('../util/constants');

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

        self.httpServer = http.createServer((request, response) => {
            self.handle(request, response);
        }).listen(config.apiPort, config.host, () => {
            log.info('API is now listening on: ' + config.apiPort);
        });
    }

    handle(request, response) {
        let self = this;

        switch (request.url) {
            case '/':

                let data = {
                    name: config.name,
                    gameVersion: config.gver,
                    maxPlayers: config.maxPlayers,
                    playerCount: self.world.getPopulation()
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify(data));
                response.end();

                break;

            case '/player/status':

                /**
                 * TODO - Get data about a player.
                 */

                break;

            default:

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({
                    error: Constants.API_CONSTANTS.NOT_FOUND_ERROR,
                    message: 'The API call could not be processed.'
                }));
                response.end();

                break;
        }

    }

}

module.exports = API;
