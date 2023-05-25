/* eslint-disable @typescript-eslint/no-unused-vars */

import Area from '../map/areas/area';

import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';
import { Minigame as Packet } from '@kaetram/common/network/impl';

import type World from '../world';
import type Player from '../entity/character/player/player';
import type { MinigamePacket } from '@kaetram/common/types/messages/outgoing';

export default class Minigame {
    // State of the minigame.
    protected started = false;

    // The lobby area for the minigame.
    protected lobby: Area = new Area(0, 0, 0, 0, 0);

    // Used to keep track of players in the minigame.
    protected playersInLobby: Player[] = [];
    protected playersInGame: Player[] = [];

    public constructor(protected world: World, private type: Opcodes.Minigame) {}

    /**
     * Superclass implementation responsible for creating the baseline requirements
     * for a minigame. This is things such as the lobby area. The rest can be handled
     * by the subclass.
     * @param area Area object used for the minigame.
     */

    public loadArea(area: Area): void {
        // Specifically handle the lobby area.
        if (area.mObjectType !== 'lobby') return;

        // Handle the entry and exit of players into the lobby.
        area.onEnter((player: Player) => this.addPlayer(player));
        area.onExit((player: Player) => this.removePlayer(player));
    }

    /**
     * Generic implementation for handling a player undergoing a disconnection
     * while in the minigame. We essentially kick them to the lobby and remove
     * them from the game.
     * @param player The player undergoing the disconnection.
     */

    public disconnect(player: Player): void {
        let lobbyPosition = this.getLobbyPosition();

        // Push the player outside the game area.
        player.setPosition(lobbyPosition.x, lobbyPosition.y, false, true);

        // Remove the player from the game they're in.
        this.playersInGame.splice(this.playersInGame.indexOf(player), 1);

        // Stop when there's only one player left.
        if (this.playersInGame.length < 2) this.stop();
    }

    /**
     * Superclass function for when a player kills another player.
     * @param player The player who has killed the other player.
     */

    public kill(player: Player): void {
        //
    }

    /**
     * Generic stop implementation for the minigame. We update the state
     * and teleport all the players back to the lobby. Additional functionality
     * can be added by the subclass.
     */

    public stop(): void {
        this.started = false;

        for (let player of this.playersInGame) {
            player.minigame = undefined;

            let position = this.getLobbyPosition();

            player.teleport(position.x, position.y, false, true);
        }

        // Clear the players from the game array.
        this.playersInGame = [];
    }

    /**
     * Adds a player to the lobby.
     * @param player The player we are adding to the lobby.
     */

    private addPlayer(player: Player): void {
        this.playersInLobby.push(player);

        this.sendPacket([player], {
            action: Opcodes.MinigameState.Lobby
        });
    }

    /**
     * Removes a player from the lobby array.
     * @param player The player we are removing from the lobby.
     */

    private removePlayer(player: Player): void {
        this.playersInLobby.splice(this.playersInLobby.indexOf(player), 1);

        this.sendPacket([player], {
            action: Opcodes.TeamWar.Exit
        });
    }

    /**
     * Used for simplification of the packet sending process. We use the
     * type of minigame (corresponds to their opcode) to send packets
     * to the players in the minigame.
     * @param players The list of players we are sending the packet to.
     * @param info The packet information we are sending.
     */

    protected sendPacket(players: Player[], info: MinigamePacket): void {
        this.world.push(Modules.PacketType.Players, {
            players,
            packet: new Packet(this.type, info)
        });
    }

    /**
     * Superclass implementation for finding a position within the lobby.
     * @returns A default position in the world.
     */

    public getLobbyPosition(): Position {
        return {
            x: Utils.randomInt(this.lobby.x + 2, this.lobby.x + this.lobby.width - 3),
            y: Utils.randomInt(this.lobby.y + 2, this.lobby.y + this.lobby.height - 3)
        };
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
