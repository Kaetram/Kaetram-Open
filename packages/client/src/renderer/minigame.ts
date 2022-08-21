/**
 * Represents the default class for minigame status. It's used by the game world
 * to update the player's status in the minigame.
 */

import { Status } from '@kaetram/common/types/minigame';

export default class Minigame {
    /**
     * @param type Represents the type of minigame we are dealing with. (Opcodes.Minigame)
     * @param status Whether the player is in-game or in the lobby.
     * @param countdown Lobby/in-game countdown timer updated from the server.
     */
    public constructor(public type = -1, public status: Status = 'exit', public countdown = 180) {}

    /**
     * Updates the minigame status.
     * @param status The new status of the minigame.
     */

    public setStatus(status: Status): void {
        this.status = status;
    }

    /**
     * A minigame status exists if the type of minigame is greater than -1.
     * @returns Whether ot not the type is greater than -1.
     */

    public exists(): boolean {
        return this.type > -1;
    }
}
