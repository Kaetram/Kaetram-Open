import config from '@kaetram/common/config';
import log from '@kaetram/common/util/log';

import Guilds from './controllers/guilds';
import Servers from './controllers/servers';
import Database from './database/database';
import API from './network/api';
import Discord from './network/discord';
import { formatServerName } from './util/utils';

class Main {
    private serversController = new Servers();
    private api = new API(this.serversController);
    private database = new Database().getDatabase();

    private discord = new Discord(this.api);

    private guilds = new Guilds(this.api, this.database);

    public constructor() {
        log.notice(`Initializing ${config.name} engine.`);

        this.api.setDiscord(this.discord);

        this.load();
        this.loadConsole();
    }

    private load() {
        this.serversController.onAdd((serverId) => {
            let serverName = formatServerName(serverId);

            log.notice(`Server ${serverId} has been added to the hub.`);

            this.discord.sendRawWebhook(`:white_check_mark: **${serverName} is now online!**`);
        });

        this.serversController.onRemove((serverId) => {
            let serverName = formatServerName(serverId);

            log.error(`Server ${serverId} has been removed from hub for inactivity.`);

            this.discord.sendRawWebhook(`:octagonal_sign: **${serverName} has gone offline!**`);
        });
    }

    private loadConsole() {
        let stdin = process.openStdin();

        stdin.addListener('data', (data) => {
            let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/') return;

            let blocks = message.slice(1).split(' '),
                command = blocks.shift();

            if (!command) return;

            switch (command) {
                case 'server':
                    this.api.findEmptyServer((response) => {
                        console.log(response);
                    });

                    break;

                case 'player': {
                    let username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    this.api.searchForPlayer(username, (response) => {
                        console.log(response);
                    });

                    break;
                }

                case 'guilds': {
                    this.database.loader.getGuilds().then((guilds) => {
                        console.log(guilds);
                    });

                    break;
                }
            }
        });
    }
}

export default new Main();
