let config = require('../../config'),
    http = require('http');

class API {

    constructor(world) {
        let self = this;

        /**
         * API will have a variety of uses. Including communication
         * between multiple worlds (planned for the future).
         */

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
                response.end();

                break;
        }

    }

}

module.exports = API;
