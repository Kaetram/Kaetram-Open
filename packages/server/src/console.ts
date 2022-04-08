import MongoDB from './database/mongodb/mongodb';
import Player from './game/entity/character/player/player';
import World from './game/world';

export default class Console {
    private database: MongoDB;

    public constructor(private world: World) {
        this.database = world.database;

        // let stdin = process.openStdin();

        // stdin.addListener('data', (data: Buffer) => {
        //     let message = data.toString().replace(/(\r\n|\n|\r)/gm, ''),
        //         type = message.charAt(0);

        //     if (type !== '/') return;

        //     let blocks = message.slice(1).split(' '),
        //         command = blocks.shift()!;

        //     if (!command) return;

        //     let username: string,
        //         player: Player,
        //         newX: number,
        //         newY: number,
        //         itemId: number,
        //         item-count: number;

        //     switch (command) {
        //         case 'players':
        //             log.info(`There are a total of ${this.getPopulation()} player(s) logged in.`);

        //             break;

        //         case 'registered':
        //             this.database.registeredCount((count) => {
        //                 log.info(`There are ${count} users registered.`);
        //             });

        //             break;

        //         case 'kill':
        //             username = blocks.join(' ');

        //             if (!this.world.isOnline(username)) {
        //                 log.info('Player is not logged in.');
        //                 return;
        //             }

        //             player = this.world.getPlayerByName(username);

        //             if (!player) {
        //                 log.info('An error has occurred.');
        //                 return;
        //             }

        //             this.world.kill(player);

        //             break;

        //         case 'resetPositions':
        //             newX = parseInt(blocks.shift()!);
        //             newY = parseInt(blocks.shift()!);

        //             // x: 325, y: 87

        //             if (!newX || !newY) {
        //                 log.info(
        //                     'Invalid command parameters. Expected: /resetPositions <newX> <newY>'
        //                 );
        //                 return;
        //             }

        //             /**
        //              * We are iterating through all of the users in the database
        //              * and resetting their position to the parameters inputted.
        //              * This is to be used when doing some game-breaking map
        //              * updates. This command is best used in tandem with the
        //              * `allowConnectionsToggle` to prevent users from logging
        //              * in.
        //              */

        //             this.database.resetPositions(newX, newY, (result) => {
        //                 log.info(result);
        //             });

        //             break;

        //         case 'allowConnections':
        //             this.world.allowConnections = !this.world.allowConnections;

        //             if (this.world.allowConnections)
        //                 log.info('Server is now allowing connections.');
        //             else log.info('The server is not allowing connections.');

        //             break;

        //         case 'give':
        //             itemId = parseInt(blocks.shift()!);
        //             item-count = parseInt(blocks.shift()!);

        //             username = blocks.join(' ');

        //             player = this.world.getPlayerByName(username);

        //             if (!player) return;

        //             player.inventory.add({
        //                 id: itemId,
        //                 count: item-count,
        //                 ability: -1,
        //                 abilityLevel: -1
        //             });

        //             break;
        //     }
        //});
    }
}
