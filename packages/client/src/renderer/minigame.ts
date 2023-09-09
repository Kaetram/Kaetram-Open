/**
 * Represents the default class for minigame status. It's used by the game world
 * to update the player's status in the minigame. This is altered in accordance
 * to the minigame the player is in.
 */

import { Opcodes } from '@kaetram/common/network';

import type { Status } from '@kaetram/common/api/minigame';
import type { MinigamePacketData } from '@kaetram/common/types/messages/outgoing';

export default class Minigame {
    // Coursing score variables.
    public score = 0;

    // TeamWar score variables.
    public redTeamScore = 0;
    public blueTeamScore = 0;

    // Generic minigame variables.
    public started = false;

    /**
     * @param type Represents the type of minigame we are dealing with. (Opcodes.Minigame)
     * @param status Whether the player is in-game or in the lobby.
     * @param countdown Lobby/in-game countdown timer updated from the server.
     */
    public constructor(
        public type = -1,
        public status: Status = 'exit',
        public countdown = 180
    ) {}

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

    public setScore(info: MinigamePacketData): void {
        switch (this.type) {
            case Opcodes.Minigame.TeamWar: {
                this.redTeamScore = info.redTeamKills || -1;
                this.blueTeamScore = info.blueTeamKills || -1;
                return;
            }

            case Opcodes.Minigame.Coursing: {
                this.score = info.score || -1;
                return;
            }
        }
    }

    /**
     * A minigame status exists if the type of minigame is greater than -1.
     * @returns Whether ot not the type is greater than -1.
     */

    public exists(): boolean {
        return this.type > -1;
    }
}
