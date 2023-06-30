import Console from './console';
import API from './controllers/api';
import Cache from './controllers/cache';
import Handler from './network/handler';
import Models from './controllers/models';
import Mailer from './controllers/mailer';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';
import Utils from '@kaetram/common/util/utils';

export default class Main {
    private cache: Cache = new Cache();
    private handler: Handler = new Handler(); // The network handler.
    private models: Models = new Models();
    private discord: Discord = new Discord();
    private mailer: Mailer = new Mailer();

    public constructor() {
        log.notice(`Initializing ${config.name} Hub ${config.gver}.`);

        // Relay global messages from the Discord server to all servers.
        this.discord.onMessage(this.models.global.bind(this.models));

        // Callbacks for the web socket server.
        this.handler.onConnection(this.models.connect.bind(this.models));
        this.handler.onDisconnect(this.models.remove.bind(this.models));

        // Callbacks for the server handler.
        this.models.onAdd(this.handleAdd.bind(this));
        this.models.onRemove(this.handleRemove.bind(this));
        this.models.onPlayer(this.handlePlayer.bind(this));
        this.models.onMessage(this.discord.sendMessage.bind(this.discord));

        if (this.handler.ready) log.notice(`Hub is now listening on port: ${config.hubWsPort}.`);

        new Console(this.models);
        new API(this.models, this.mailer, this.cache);
    }

    /**
     * Callback handler for when a new server is added.
     * @param serverId The id of the server we just added.
     */

    private handleAdd(id: number, name: string): void {
        log.notice(`${name} ${id} has come online!`);

        this.discord.sendRawMessage(`:white_check_mark: **${name} ${id} is now online!**`);
    }

    /**
     * Callback handler for when a server times out.
     * @param serverId The id of the server that timed out.
     */

    private handleRemove(id: number, name: string): void {
        log.notice(`${name} ${id} has disconnected.`);

        this.discord.sendRawMessage(`:octagonal_sign: **${name} ${id} has gone offline!**`);
    }

    /**
     * Callback for when a player logs out or logs into any of the servers. We use this
     * to send a message to the Discord bot and to update the population.
     * @param username The username of the player that logged in or out.
     * @param serverId The id of the server that the player logged in or out of.
     * @param logout Whether or not the player logged out.
     * @param population The current population of all the servers.
     */

    private handlePlayer(
        username: string,
        serverId: number,
        logout: boolean,
        population: number
    ): void {
        this.discord.sendMessage(
            Utils.formatName(username),
            logout ? 'has logged out!' : 'has logged in!',
            `${config.name} ${serverId}`,
            false
        );

        // Update the population of the Discord server.
        this.discord.setTopic(
            `Currently ${population} player${population === 1 ? '' : 's'} online.`
        );
    }
}

new Main();
