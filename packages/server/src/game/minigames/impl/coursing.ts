import Minigame from '../minigame';
import Area from '../../map/areas/area';

import Utils from '@kaetram/common/util/utils';
import { Team } from '@kaetram/common/api/minigame';
import { Modules, Opcodes } from '@kaetram/common/network';

import type World from '../../world';
import type Player from '../../entity/character/player/player';

/**
 * Temporary name for this minigame. This minigame consists of a hunter
 * and a prey. The hunter has a certain amount of time to kill the prey,
 * at which point they will receive a reward. The prey must survive
 * for a certain amount of time, at which point they will receive a reward.
 */

export default class Coursing extends Minigame {
    public override name = 'Coursing';

    protected override countdown: number = Modules.MinigameConstants.COURSING_COUNTDOWN;

    private hunterSpawn: Area = new Area(0, 0, 0, 0, 0);
    private preySpawns: Area[] = [];

    // Used to calculate distance of the prey from the centre.
    private centre: Position = { x: 0, y: 0 };

    public constructor(world: World) {
        super(world, Opcodes.Minigame.Coursing);
    }

    /**
     * Loads the necessary areas for the minigame. This includes the lobby
     * (handled in the super class) and the spawn areas for the hunter and
     * the prey.
     * @param area The area that we are loading (received from the map).
     */

    public override loadArea(area: Area): void {
        super.loadArea(area);

        switch (area.mObjectType) {
            case 'hunterspawn': {
                this.hunterSpawn = area;
                return;
            }

            case 'preyspawn': {
                // Add the area to the list of prey spawns.
                this.preySpawns.push(area);
                return;
            }

            case 'centre': {
                this.centre.x = area.x;
                this.centre.y = area.y;
                return;
            }
        }
    }

    /**
     * Handles the game logic for the minigame. This includes the lobby cooldown,
     * the in-game timer, and the game ending.
     */

    public override tick(): void {
        if (this.countdown <= 0) {
            this.countdown = Modules.MinigameConstants.COURSING_COUNTDOWN;

            // Attempt to start if not started, otherwise end the game.
            if (this.started) this.stop();
            else this.start();

            return;
        }

        this.countdown--;

        // Send the countdown packet to the players in the lobby (if any).
        if (this.playersInLobby.length > 0)
            this.sendPacket(this.playersInLobby, {
                action: Opcodes.MinigameActions.Lobby,
                countdown: this.countdown,
                started: this.started
            });

        // We only update the score and send the packet every 4 ticks.
        if (this.countdown % 4 !== 0) return;

        /**
         * We iterate through all the players in the game and update their score relative
         * to their distance from the centre of the map. We then send a packet to the player
         * updating their score.
         */

        this.forEachPlayerInGame((player: Player) => {
            if (player.team === Team.Prey) {
                // Dead players get a decrement in score for every tick.
                if (player.dead) return player.incrementCoursingScore(-10);

                // Grab the distance from the centre of the map to the player.
                let distance = Utils.getDistance(player.x, player.y, this.centre.x, this.centre.y),
                    score = Math.floor(distance / Modules.MinigameConstants.COURSING_SCORE_DIVISOR);

                // Update the player's score.
                player.incrementCoursingScore(score);

                // Send a packet updating the player's score.
                this.sendPacket([player], {
                    action: Opcodes.MinigameActions.Score,
                    score: player.coursingScore
                });
            }
        });
    }

    /**
     * Grabs a spawn point depending on whether or not the player is a hunter
     * or a prey. In the case of a prey, we pick one of the spawn areas and
     * return a random point within that area.
     * @param isPrey Whether or not we are picking a spawn point for a prey or a hunter.
     */

    public override getSpawnPoint(isPrey = false): Position {
        if (!this.started) return super.getSpawnPoint();

        let area = isPrey
            ? this.preySpawns[Utils.randomInt(0, this.preySpawns.length - 1)]
            : this.hunterSpawn;

        return {
            x: Utils.randomInt(area.x + 1, area.x + area.width - 1),
            y: Utils.randomInt(area.y + 1, area.y + area.height - 1)
        };
    }

    /**
     * Begins the minigames and equally distributes the players into hunters
     * and prey. If we have an uneven amount of players then we will ignore
     * one of the players at random.
     */

    private start(): void {
        this.playersInLobby = this.shuffleLobby();

        // Not enough players to start.
        if (
            this.playersInLobby.length < (Modules.MinigameConstants.COURSING_MIN_PLAYERS as number)
        ) {
            // Notify the players that we need more players.
            for (let player of this.playersInLobby)
                player.notify(
                    `misc:MINIMUM_PLAYERS_MINIGAME;minimum=${Modules.MinigameConstants.COURSING_MIN_PLAYERS}`
                );

            return;
        }

        // Mark the game as started.
        this.started = true;

        // The length of players is always even, so we check that here.
        let count =
                this.playersInLobby.length % 2 === 0
                    ? this.playersInLobby.length
                    : this.playersInLobby.length - 1,
            hunters = this.playersInLobby.splice(0, count / 2),
            prey = this.playersInLobby.splice(0, count / 2);

        /**
         * Iterate through both the hunters and the prey and assign
         * the targets to each player (1 to 1 mapping).
         */

        for (let [i, hunter] of hunters.entries()) {
            hunter.team = Team.Hunter;
            prey[i].team = Team.Prey;

            hunter.coursingTarget = prey[i].instance;
            prey[i].coursingTarget = hunter.instance;
        }

        // Concatenate the two arrays into the playersInGame array.
        this.playersInGame = [...hunters, ...prey];

        // Teleport all the players to their spawn points.
        for (let player of this.playersInGame) {
            player.minigame = Opcodes.Minigame.Coursing;
            player.coursingScore = 0;

            // Grab the spawn point for the player based on their team.
            let position = this.getSpawnPoint(player.team === Team.Prey);

            player.teleport(position.x, position.y, false, true);
        }

        setTimeout(() => this.sendPointers(), 1500);
    }

    /**
     * Stops the minigame and sends all the players back to the lobby.
     */

    public override stop(): void {
        super.stop();
    }

    /**
     * Sends the pointer packet to all the players in the game. This packet
     * is sent a little time after the game starts so that all the characters
     * have time to load in for every player.
     */

    private sendPointers(): void {
        for (let player of this.playersInGame)
            player.pointer({
                type: Opcodes.Pointer.Entity,
                instance: player.coursingTarget
            });
    }
}
