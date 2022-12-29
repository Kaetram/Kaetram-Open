/* eslint-disable @typescript-eslint/no-unused-vars */

import type Player from '../entity/character/player/player';
import type Area from '../map/areas/area';

export default class Minigame {
    public constructor(public key: string) {}

    /**
     * Superclass function that is called when an area is loaded into the minigame. Once
     * the server finishes initializing, it looks through all the minigame areas and
     * loads them depending on their key.
     * @param area Area object used for the minigame.
     */

    public loadArea(area: Area): void {
        //
    }

    /**
     * Handler for when a player disconnects from the game while in a minigame.
     * @param player The player undergoing the disconnection.
     */

    public disconnect(player: Player): void {
        //
    }

    /**
     * Superclass function for when a player kills another player.
     * @param player The player who has killed the other player.
     */

    public kill(player: Player): void {
        //
    }

    /**
     * Superclass implementation for finding a position within the lobby.
     * @returns A default position in the world.
     */

    public getLobbyPosition(): Position {
        return { x: 50, y: 23 };
    }

    /**
     * Superclass implementation for respawn during a minigame.
     * @params _var1 Optional parameter for the spawn point.
     * @returns Default position in the world.
     */

    public getRespawnPoint(_var1?: unknown): Position {
        return { x: 50, y: 23 };
    }
}
