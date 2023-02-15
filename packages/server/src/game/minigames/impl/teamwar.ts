import { Minigame as Packet } from '../../../network/packets';
import Area from '../../map/areas/area';
import Minigame from '../minigame';

import { Team } from '@kaetram/common/api/minigame';
import { Modules, Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type { MinigamePacket } from '@kaetram/common/types/messages/outgoing';
import type Player from '../../entity/character/player/player';
import type World from '../../world';

export default class TeamWar extends Minigame {
    private started = false;
    private countdown: number = Modules.MinigameConstants.TEAM_WAR_COUNTDOWN;

    private lobby: Area = new Area(0, 0, 0, 0, 0); // Empty area.
    private redSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for red team.
    private blueSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for blue team.

    private players: Player[] = []; // Players currently in the game.
    private playersLobby: Player[] = []; // Players currently in the lobby.

    private redTeamKills = 0;
    private blueTeamKills = 0;

    public constructor(private world: World) {
        super('teamwar');

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
            case 'lobby': {
                this.lobby = area;

                // Lobby area enter and exit callbacks.
                this.lobby.onEnter((player: Player) => this.addPlayer(player));
                this.lobby.onExit((player: Player) => this.removePlayer(player));
                return;
            }

            case 'redteamspawn': {
                this.redSpawn = area;
                return;
            }

            case 'blueteamspawn': {
                this.blueSpawn = area;
                return;
            }
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
        player.setPosition(lobbyPosition.x, lobbyPosition.y, false, true);

        // Remove the player from the game they're in.
        this.players.splice(this.players.indexOf(player), 1);

        // Stop when there's only one player left.
        if (this.players.length < 2) this.stop();
    }

    /**
     * Handles the point distribution for when a player kills another player.
     * @param player The player who has killed the other player. This is the player
     * whose team we are awarding points to.
     */

    public override kill(player: Player): void {
        if (player.team === Team.Blue) this.blueTeamKills++;
        else if (player.team === Team.Red) this.redTeamKills++;
    }

    /**
     * @returns Randomly selects and returns a random x and y coordinate within
     * the boundaries of the lobby area.
     */

    public override getLobbyPosition(): Position {
        return {
            x: Utils.randomInt(this.lobby.x + 2, this.lobby.x + this.lobby.width - 3),
            y: Utils.randomInt(this.lobby.y + 2, this.lobby.y + this.lobby.height - 3)
        };
    }

    /**
     * Finds a random point within the red or blue team depending on the team paramaeter.
     * @params team The team we are grabbing the respawn point for.
     * @returns Returns a respawn point within the minigame area depending on the team.
     */

    public override getRespawnPoint(team: Team): Position {
        if (!this.started) return this.getLobbyPosition();

        let area = team === Team.Red ? this.redSpawn : this.blueSpawn;

        return {
            x: Utils.randomInt(area.x + 1, area.x + area.width - 1),
            y: Utils.randomInt(area.y + 1, area.y + area.height - 1)
        };
    }

    /**
     * Function called every 1 second interval that handles the minigame logic.
     */

    private tick(): void {
        if (this.countdown <= 0) {
            this.countdown = Modules.MinigameConstants.TEAM_WAR_COUNTDOWN;

            // Attempt to start if not started, otherwise end the game.
            if (this.started) this.stop();
            else this.start();

            return;
        }

        this.countdown--;

        // Send the score packet to the players in-game.
        if (this.players.length > 0)
            this.sendPacket(this.players, {
                action: Opcodes.TeamWar.Score,
                countdown: this.countdown,
                redTeamKills: this.redTeamKills,
                blueTeamKills: this.blueTeamKills
            });

        // Send the countdown packet to the players in the lobby.
        if (this.playersLobby.length > 0)
            this.sendPacket(this.playersLobby, {
                action: Opcodes.TeamWar.Lobby,
                countdown: this.countdown,
                started: this.started
            });
    }

    /**
     * Shuffles the players in the lobby.
     * @returns Returns the shuffled players in the lobby.
     */

    private shuffleLobby(): Player[] {
        let lobby = this.playersLobby;

        for (let x = lobby.length - 1; x > 0; x--) {
            let y = Math.floor(Math.random() * x),
                temp = lobby[x];

            lobby[x] = lobby[y];
            lobby[y] = temp;
        }

        return lobby;
    }

    /**
     * Finds all the players in the lobby and splits them into two teams,
     * then we send packets to both teams to assign teams.
     */

    private start(): void {
        let redTeam = this.shuffleLobby();

        // Not enough players, we're not starting the game.
        if (redTeam.length < Modules.MinigameConstants.TEAM_WAR_MIN_PLAYERS) {
            // Notify all players there aren't enough players in the lobby.
            for (let player of redTeam)
                player.notify(
                    `There must be at least ${Modules.MinigameConstants.TEAM_WAR_MIN_PLAYERS} players to start the game.`
                );

            return;
        }

        this.started = true;

        let blueTeam = redTeam.splice(0, redTeam.length / 2);

        // Assign each player in each team their respective team.
        for (let player of redTeam) player.team = Team.Red;
        for (let player of blueTeam) player.team = Team.Blue;

        // Concatenate all the players into one array for later.
        this.players = [...redTeam, ...blueTeam];

        // Teleport every player to the lobby.
        for (let player of this.players) {
            player.minigame = Opcodes.Minigame.TeamWar;

            let position = this.getRespawnPoint(player.team);

            player.teleport(position.x, position.y, false, true);
        }
    }

    /**
     * Stops the game and handles all the packets and cleanups.
     */

    private stop(): void {
        this.started = false;

        this.sendPacket(this.players, {
            action: Opcodes.TeamWar.End
        });

        // Teleport all the players back to the lobby.
        for (let player of this.players) {
            player.minigame = -1;

            let position = this.getLobbyPosition();

            player.teleport(position.x, position.y, false, true);
        }

        // Clear all the team dictionaries and in-game player arrays.
        this.players = [];

        this.redTeamKills = 0;
        this.blueTeamKills = 0;
    }

    /**
     * Adds a player to the lobby.
     * @param player The player we are adding to the lobby.
     */

    private addPlayer(player: Player): void {
        this.playersLobby.push(player);

        this.sendPacket([player], {
            action: Opcodes.TeamWar.Lobby
        });
    }

    /**
     * Removes a player from the lobby array.
     * @param player The player we are removing from the lobby.
     */

    private removePlayer(player: Player): void {
        this.playersLobby.splice(this.playersLobby.indexOf(player), 1);

        this.sendPacket([player], {
            action: Opcodes.TeamWar.Exit
        });
    }

    /**
     * Used to simplify the packet sending to a group of players.
     * @param players The group of players we are sending the packet to.
     * @param info Contains the minigame packet data.
     */

    private sendPacket(players: Player[], info: MinigamePacket): void {
        this.world.push(Modules.PacketType.Players, {
            players,
            packet: new Packet(Opcodes.Minigame.TeamWar, info)
        });
    }
}
