import Console from './console';
import API from './controllers/api';
import Cache from './controllers/cache';
import Handler from './network/handler';
import Servers from './controllers/servers';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';

export default class Main {
    private cache: Cache = new Cache();
    private servers: Servers = new Servers();
    private handler: Handler = new Handler(); // The network handler.
    private discord: Discord = new Discord();

    public constructor() {
        log.notice(`Initializing ${config.name} Hub ${config.gver}.`);

        // Relay global messages from the Discord server to all servers.
        this.discord.onMessage(this.servers.global.bind(this.servers));

        // Callbacks for the web socket server.
        this.handler.onConnection(this.servers.connect.bind(this.servers));
        this.handler.onDisconnect(this.servers.remove.bind(this.servers));

        // Callbacks for the server handler.
        this.servers.onAdd(this.handleAdd.bind(this));
        this.servers.onRemove(this.handleRemove.bind(this));
        this.servers.onMessage(this.discord.sendRawMessage.bind(this.discord));

        if (this.handler.ready) log.notice(`Hub is now listening on port: ${config.hubWsPort}.`);

        new Console(this.servers);
        new API(this.servers, this.discord, this.cache);
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
     * Callback handler for when servers undergo an update in their data. This is
     * usually for the player count that we then update the Discord bot with.
     */

    private handleUpdate(): void {
        let players = this.servers.getTotalPlayers();

        this.discord.setTopic(`Currently ${players} player${players === 1 ? '' : 's'} online.`);
    }
}

new Main();
