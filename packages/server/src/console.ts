import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import type World from './game/world';
import type Player from './game/entity/character/player/player';
import type MongoDB from '@kaetram/common/database/mongodb/mongodb';

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
                    this.database.registeredCount((count: number) => {
                        log.info(`There are ${count} users registered.`);
                    });

                    break;
                }

                case 'update': {
                    this.world.entities.forEachPlayer((player: Player) => {
                        player.connection.reject('updated');
                    });

                    // No connections allowed for the remaining instance of the server.
                    this.world.allowConnections = false;

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

                    player.connection.close();

                    break;
                }

                case 'setadmin':
                case 'setmod': {
                    username = blocks.join(' ');

                    if (!this.world.isOnline(username)) return log.info('Player is not logged in.');

                    player = this.world.getPlayerByName(username);

                    if (!player) return log.info(`Player not found.`);

                    player.setRank(
                        command === 'setadmin' ? Modules.Ranks.Admin : Modules.Ranks.Moderator
                    );

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

                    player.setRank();

                    player.notify(`Your ranks have been stripped from you.`);

                    player.sync();

                    break;
                }

                case 'save': {
                    log.info(`Saving all players.`);
                    return this.world.save();
                }
            }
        });
    }
}
