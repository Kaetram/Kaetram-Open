import log from '@kaetram/common/util/log';

import type Servers from './controllers/servers';
import type Server from './model/server';

export default class Console {
    public constructor(private servers: Servers) {
        let { stdin } = process;

        stdin.addListener('data', (data) => {
            let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/') return;

            let blocks = message.slice(1).split(' '),
                command = blocks.shift();

            if (!command) return;

            let username: string;

            switch (command) {
                case 'server': {
                    return this.servers.findEmpty((server: Server) => console.log(server));
                }

                case 'player': {
                    username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    console.log(this.servers.findPlayer(username));

                    break;
                }
            }
        });
    }
}
