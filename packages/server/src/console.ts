import log from '@kaetram/common/util/log';

import MongoDB from './database/mongodb/mongodb';
import Player from './game/entity/character/player/player';
import World from './game/world';

/**
 * The console lives on top of the server. It allows an admin to directly
 * control events within the server from the console instead
 * of logging in. The commands available are listed below in a switch statement.
 */

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
                case 'players': {
                    log.info(
                        `There are a total of ${
                            this.world.entities.getPlayerUsernames().length
                        } player(s) logged in.`
                    );

                    break;
                }

                case 'total': {
                    this.database.registeredCount((count) => {
                        log.info(`There are ${count} users registered.`);
                    });

                    break;
                }

                case 'update': {
                    this.world.entities.forEachPlayer((player: Player) => {
                        player.connection.reject('updated');
                    });

                    break;
                }

                case 'kill': {
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) return log.info('Player is not logged in.');

                    player = this.world.getPlayerByName(username);

                    if (!player) return log.info('An error has occurred.');

                    player.hit(player.hitPoints.getHitPoints());

                    break;
                }

                case 'kick':
                case 'timeout': {
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) return log.info('Player is not logged in.');

                    player = this.world.getPlayerByName(username);

                    if (!player) return log.info('An error has occurred.');

                    if (command === 'timeout') player.timeout();
                    else player.connection.close();

                    break;
                }

                case 'setadmin':
                case 'setmod': {
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) return log.info('Player is not logged in.');

                    player = this.world.getPlayerByName(username);

                    if (!player) return log.info(`Player not found.`);

                    player.rights = command === 'setadmin' ? 2 : 1;

                    player.sync();

                    log.info(
                        `${player.username} is now a ${command === 'setadmin' ? 'admin' : 'mod'}!`
                    );

                    break;
                }

                case 'removeadmin':
                case 'removemod': {
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) return log.info('Player is not logged in.');

                    player = this.world.getPlayerByName(username);

                    if (!player) return log.info(`Player not found.`);

                    player.rights = command === 'removeadmin' ? 2 : 1;

                    log.info(
                        `${player.username} is now a ${
                            command === 'removeadmin' ? 'admin' : 'mod'
                        }!`
                    );

                    break;
                }

                case 'resetpositions': {
                    log.info(`Resetting all player positions.`);

                    return this.database.resetPositions();
                }

                case 'save': {
                    log.info(`Saving all players.`);
                    return this.world.save();
                }
            }
        });
    }
}
