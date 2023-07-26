import Area from '../../map/areas/area';
import Minigame from '../minigame';

import Utils from '@kaetram/common/util/utils';
import { Team } from '@kaetram/common/api/minigame';
import { Modules, Opcodes } from '@kaetram/common/network';

import type World from '../../world';
import type Player from '../../entity/character/player/player';

export default class TeamWar extends Minigame {
    public override name = 'TeamWar';

    protected override countdown: number = Modules.MinigameConstants.TEAM_WAR_COUNTDOWN;

    // Areas for the minigame.
    private redSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for red team.
    private blueSpawn: Area = new Area(0, 0, 0, 0, 0); // Spawn area for blue team.

    private redTeamKills = 0;
    private blueTeamKills = 0;

    public constructor(world: World) {
        super(world, Opcodes.Minigame.TeamWar);
    }

    /**
     * Loads a map area into the TeamWar minigame. We use this to load
     * the lobby area and begin working with it.
     * @param area Area object received from the map.
     */

    public override loadArea(area: Area): void {
        super.loadArea(area);

        switch (area.mObjectType) {
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
     * Handles the point distribution for when a player kills another player.
     * @param player The player who has killed the other player. This is the player
     * whose team we are awarding points to.
     */

    public override kill(player: Player): void {
        if (player.team === Team.Blue) this.blueTeamKills++;
        else if (player.team === Team.Red) this.redTeamKills++;
    }

    /**
     * Finds a random point within the red or blue team depending on the team parameter.
     * @params team The team we are grabbing the spawn point for.
     * @returns Returns a spawn point within the minigame area depending on the team.
     */

    public override getSpawnPoint(team: Team): Position {
        if (!this.started) return super.getSpawnPoint();

        let area = team === Team.Red ? this.redSpawn : this.blueSpawn;

        return {
            x: Utils.randomInt(area.x + 1, area.x + area.width - 1),
            y: Utils.randomInt(area.y + 1, area.y + area.height - 1)
        };
    }

    /**
     * Function called every 1 second interval that handles the minigame logic.
     */

    protected override tick(): void {
        if (this.countdown <= 0) {
            this.countdown = Modules.MinigameConstants.TEAM_WAR_COUNTDOWN;

            // Attempt to start if not started, otherwise end the game.
            if (this.started) this.stop();
            else this.start();

            return;
        }

        this.countdown--;

        // Send the score packet to the players in-game.
        if (this.playersInGame.length > 0)
            this.sendPacket(this.playersInGame, {
                action: Opcodes.MinigameActions.Score,
                countdown: this.countdown,
                redTeamKills: this.redTeamKills,
                blueTeamKills: this.blueTeamKills
            });

        // Send the countdown packet to the players in the lobby.
        if (this.playersInLobby.length > 0)
            this.sendPacket(this.playersInLobby, {
                action: Opcodes.MinigameActions.Lobby,
                countdown: this.countdown,
                started: this.started
            });
    }

    /**
     * Finds all the players in the lobby and splits them into two teams,
     * then we send packets to both teams to assign teams.
     */

    private start(): void {
        let redTeam = this.shuffleLobby();

        // Not enough players, we're not starting the game.
        if (redTeam.length < (Modules.MinigameConstants.TEAM_WAR_MIN_PLAYERS as number)) {
            // Notify all players there aren't enough players in the lobby.
            for (let player of redTeam)
                player.notify(
                    `misc:MINIMUM_PLAYERS_MINIGAME;minimum=${Modules.MinigameConstants.TEAM_WAR_MIN_PLAYERS}`
                );

            return;
        }

        this.started = true;

        let blueTeam = redTeam.splice(0, redTeam.length / 2);

        // Assign each player in each team their respective team.
        for (let player of redTeam) player.team = Team.Red;
        for (let player of blueTeam) player.team = Team.Blue;

        // Concatenate all the players into one array for later.
        this.playersInGame = [...redTeam, ...blueTeam];

        // Teleport every player to the lobby.
        for (let player of this.playersInGame) {
            player.minigame = Opcodes.Minigame.TeamWar;

            // Grab the spawn point for the player's team.
            let position = this.getSpawnPoint(player.team!);

            player.teleport(position.x, position.y, false, true);
        }
    }

    /**
     * Stops the game and handles all the packets and cleanups.
     */

    public override stop(): void {
        super.stop();

        this.redTeamKills = 0;
        this.blueTeamKills = 0;
    }
}
