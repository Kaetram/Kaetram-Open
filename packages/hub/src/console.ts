import log from '@kaetram/common/util/log';

import type Models from './controllers/models';

export default class Console {
    public constructor(private models: Models) {
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
                    return console.log(this.models.findEmptyServer());
                }

                case 'player': {
                    username = blocks.join(' ');

                    if (!username) {
                        log.warning('Malformed command - Format: /player [username]');
                        return;
                    }

                    console.log(this.models.findPlayer(username));

                    break;
                }
            }
        });
    }
}
