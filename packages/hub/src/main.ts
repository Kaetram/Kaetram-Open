import API from './api';

import log from '@kaetram/common/util/log';
import config from '@kaetram/common/config';
import Discord from '@kaetram/common/api/discord';

import Servers from './controllers/servers';
import Console from './console';

export default class Main {
    private discord: Discord = new Discord();
    private servers: Servers = new Servers();

    private api: API;

    public constructor() {
        log.notice(`Initializing ${config.name} Hub ${config.gver}.`);

        this.api = new API(this.servers, this.discord);

        this.discord.onMessage(this.api.broadcastChat.bind(this.api));

        this.servers.onAdd(this.handleAdd.bind(this));
        this.servers.onRemove(this.handleRemove.bind(this));

        new Console(this.servers);
    }

    /**
     * Callback handler for when a new server is added.
     * @param serverId The id of the server we just added.
     */

    private handleAdd(serverId: number): void {
        log.notice(`${config.name} ${serverId} has come online!`);

        this.discord.sendRawMessage(
            `:white_check_mark: **${config.name} ${serverId} is now online!**`
        );
    }

    /**
     * Callback handler for when a server times out.
     * @param serverId The id of the server that timed out.
     */

    private handleRemove(serverId: string): void {
        log.notice(`${config.name} ${serverId} has timed out.`);

        this.discord.sendRawMessage(
            `:octagonal_sign: **${config.name} ${serverId} has gone offline!**`
        );
    }
}

new Main();
