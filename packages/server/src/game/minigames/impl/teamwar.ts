import _ from 'lodash';

import Minigame from '../minigame';
import World from '../../world';
import Area from '../../map/areas/area';
import Player from '../../entity/character/player/player';
import Grids from '../../map/grids';

import Utils from '@kaetram/common/util/utils';

import { Modules, Opcodes } from '@kaetram/common/network';

import { Minigame as MinigamePacket } from '../../../network/packets';

export default class TeamWar extends Minigame {
    private grids: Grids;

    private started = false;
    private countdown = 180;

    private lobby: Area = new Area(0, 0, 0, 0, 0); // Empty area.
    private redSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for red team.
    private blueSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for blue team.

    private players: Player[] = []; // Players currently in the game.
    private playersLobby: Player[] = []; // Players currently in the lobby.

    private redTeamPoints = 0;
    private blueTeamPoints = 0;

    public constructor(private world: World) {
        super('teamwar');

        this.grids = this.world.map.grids;

        // Begin the tick interval for the minigame.
        setInterval(this.tick.bind(this), 1000);
    }

    /**
     * Loads a map area into the TeamWar minigame. We use this to load
     * the lobby area and begin working with it.
     * @param area Area object received from the map.
     */

    public override loadArea(area: Area): void {
        switch (area.mObjectType) {
            case 'lobby':
                this.lobby = area;

                // Lobby area enter and exit callbacks.
                this.lobby.onEnter((player: Player) => this.addPlayer(player));
                this.lobby.onExit((player: Player) => this.removePlayer(player));
                return;

            case 'redteamspawn':
                this.redSpawn = area;
                return;

            case 'blueteamspawn':
                this.blueSpawn = area;
                return;
        }
    }

    /**
     * Handles the disconnection of a player during the TeamWar minigame. We remove
     * the player from all the teams and ensure they're no longer registered in the game.
     * We also ensure we teleport the player to the lobby.
     * @param player The player we are removing from the game.
     */

    public override disconnect(player: Player): void {
        let lobbyPosition = this.getLobbyPosition();

        // Push the player outside the game area.
        player.setPosition(lobbyPosition.x, lobbyPosition.y);

        // Remove the player from the game they're in.
        this.players.splice(this.players.indexOf(player), 1);
    }

    /**
     * Handles the point distribution for when a player kills another player.
     * @param player The player who has killed the other player. This is the player
     * whose team we are awarding points to.
     */

    public override kill(player: Player): void {
        if (player.team === Opcodes.TeamWar.Blue) this.blueTeamPoints++;
        else if (player.team === Opcodes.TeamWar.Red) this.redTeamPoints++;
    }

    /**
     * @returns Randomly selects and returns a random x and y coordinate within
     * the boundaries of the lobby area.
     */

    public override getLobbyPosition(): Position {
        return {
            x: Utils.randomInt(this.lobby.x, this.lobby.x + this.lobby.width),
            y: Utils.randomInt(this.lobby.y, this.lobby.y + this.lobby.height)
        };
    }

    /**
     * Finds a random point within the red or blue team depending on the team paramaeter.
     * @params team The team we are grabbing the respawn point for.
     * @returns Returns a respawn point within the minigame area depending on the team.
     */

    public override getRespawnPoint(team: Opcodes.TeamWar): Position {
        let area = team === Opcodes.TeamWar.Red ? this.redSpawn : this.blueSpawn;

        return {
            x: Utils.randomInt(area.x, area.x + area.width),
            y: Utils.randomInt(area.y, area.y + area.height)
        };
    }

    /**
     * Function called every 1 second interval that handles the minigame logic.
     */

    private tick(): void {
        if (this.countdown <= 0) {
            this.countdown = 180;

            // Attempt to start if not started, otherwise end the game.
            if (!this.started) this.start();
            else this.stop();
        }

        this.countdown--;

        this.sendPacket(this.playersLobby, Opcodes.TeamWar.Lobby, this.countdown);
    }

    /**
     * Finds all the players in the lobby and splits them into two teams,
     * then we send packets to both teams to assign teams.
     */

    private start(): void {
        let redTeam = _.shuffle(this.playersLobby);

        // Not enough players, we're not starting the game.
        if (redTeam.length < 3) return;

        let blueTeam = redTeam.splice(0, redTeam.length / 2);

        this.sendPacket(redTeam, Opcodes.TeamWar.Red);
        this.sendPacket(blueTeam, Opcodes.TeamWar.Blue);

        // Concatenate all the players into one array for later.
        this.players = [...redTeam, ...blueTeam];

        this.started = true;
    }

    /**
     * Stops the game and handles all the packets and cleanups.
     */

    private stop(): void {
        this.sendPacket(this.players, Opcodes.TeamWar.End);

        this.started = false;

        // Clear all the team dictionaries and in-game player arrays.
        this.players = [];

        this.redTeamPoints = 0;
        this.blueTeamPoints = 0;
    }

    /**
     * Adds a player to the lobby.
     * @param player The player we are adding to the lobby.
     */

    private addPlayer(player: Player): void {
        this.playersLobby.push(player);

        this.sendPacket([player], Opcodes.TeamWar.Lobby);
    }

    /**
     * Removes a player from the lobby array.
     * @param player The player we are removing from the lobby.
     */

    private removePlayer(player: Player): void {
        this.playersLobby.splice(this.playersLobby.indexOf(player), 1);

        this.sendPacket([player], Opcodes.TeamWar.Exit);
    }

    /**
     * Used to simplify the packet sending to a group of players.
     * @param players The group of players we are sending the packet to.
     * @param opcode The opcode we are sending to the group.
     */

    private sendPacket(players: Player[], opcode: Opcodes.TeamWar, countdown = 0): void {
        this.world.push(Modules.PacketType.Players, {
            players,
            packet: new MinigamePacket(Opcodes.Minigame.TeamWar, {
                action: opcode,
                countdown
            })
        });
    }
}
