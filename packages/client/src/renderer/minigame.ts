/**
 * Represents the default class for minigame status. It's used by the game world
 * to update the player's status in the minigame.
 */

import type { Status } from '@kaetram/common/api/minigame';

export default class Minigame {
    // TeamWar score variables.
    public redTeamScore = 0;
    public blueTeamScore = 0;
    public started = false;

    /**
     * @param type Represents the type of minigame we are dealing with. (Opcodes.Minigame)
     * @param status Whether the player is in-game or in the lobby.
     * @param countdown Lobby/in-game countdown timer updated from the server.
     */
    public constructor(public type = -1, public status: Status = 'exit', public countdown = 180) {}

    /**
     * Resets the minigame status to default.
     */

    public reset(): void {
        this.type = -1;
        this.status = 'exit';
        this.started = false;
    }

    /**
     * Updates the minigame status.
     * @param status The new status of the minigame.
     */

    public setStatus(status: Status): void {
        this.status = status;
    }

    /**
     * Updates the score for the TeamWar minigame.
     * @param redTeam New red team score.
     * @param blueTeam New blue team score.
     */

    public setScore(redTeam: number, blueTeam: number): void {
        this.redTeamScore = redTeam;
        this.blueTeamScore = blueTeam;
    }

    /**
     * A minigame status exists if the type of minigame is greater than -1.
     * @returns Whether ot not the type is greater than -1.
     */

    public exists(): boolean {
        return this.type > -1;
    }
}
