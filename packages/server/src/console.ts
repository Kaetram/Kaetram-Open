import log from '@kaetram/common/util/log';

import MongoDB from './database/mongodb/mongodb';
import Player from './game/entity/character/player/player';
import World from './game/world';

export default class Console {
    private database: MongoDB;

    public constructor(private world: World) {
        this.database = world.database;

        let stdin = process.openStdin();

        stdin.addListener('data', (data: Buffer) => {
            let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
                type = message.charAt(0);

            if (type !== '/') return;

            let blocks = message.slice(1).split(' '),
                command = blocks.shift()!;

            if (!command) return;

            let username: string, player: Player;

            switch (command) {
                case 'players':
                    log.info(
                        `There are a total of ${
                            this.world.entities.getPlayerUsernames().length
                        } player(s) logged in.`
                    );

                    break;

                case 'total':
                    this.database.registeredCount((count) => {
                        log.info(`There are ${count} users registered.`);
                    });

                    break;

                case 'kill':
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) {
                        log.info('Player is not logged in.');
                        return;
                    }

                    player = this.world.getPlayerByName(username);

                    if (!player) {
                        log.info('An error has occurred.');
                        return;
                    }

                    player.hit(player.hitPoints.getHitPoints());

                    break;
            }
        });
    }
}
