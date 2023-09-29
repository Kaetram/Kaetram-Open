import { Opcodes, Packets } from '@kaetram/common/network';

import type Character from './character';
import type Game from '../../game';
import type EntitiesController from '../../controllers/entities';

export default class Handler {
    protected game: Game;
    protected entities: EntitiesController;

    /**
     * The handler is responsible for handling the character's movement and synchronizing
     * that with the rest of the client. It also sends packets when appropriate.
     */

    public constructor(protected character: Character) {
        this.game = character.game;
        this.entities = this.game.entities;

        // Callbacks for movements.
        this.character.onRequestPath(this.handleRequestPath.bind(this));
        this.character.onStartPathing(this.handleStartPathing.bind(this));
        this.character.onBeforeStep(this.handleBeforeStep.bind(this));
        this.character.onStep(this.handleStep.bind(this));
        this.character.onSecondStep(this.handleSecondStep.bind(this));
        this.character.onStopPathing(this.handleStopPathing.bind(this));
        this.character.onMove(this.handleMove.bind(this));
        this.character.onFallback(this.handleFallback.bind(this));
    }

    /**
     * Callback that handles when the player clicks on a new tile. We must
     * calculate the path to the new tile and begin moving the player.
     * @param x The x grid coordinate of the tile the player clicked on.
     * @param y The y grid coordinate of the tile the player clicked on.
     * @returns The path to the new tile in a 2D array.
     */

    protected handleRequestPath(x: number, y: number): number[][] {
        // Prevent any calculations from being made if the player clicked on the tile they are already on.
        if (this.character.gridX === x && this.character.gridY === y) return [];

        // Prevent calculating paths if the tile is colliding.
        if (this.game.map.isColliding(x, y)) return [];

        return this.game.findPath(this.character, x, y);
    }

    /**
     * Simply updates the moving state of the character when pathing begins. Some subclass
     * implementations such as the player may expand upon this.
     * @param path The path in a 2D array containing the x and y coordinates of each tile.
     */

    protected handleStartPathing(_path: number[][]): void {
        this.character.moving = true;
    }

    /**
     * Handles the unregistering of the position prior to beginning movement.
     */

    protected handleBeforeStep(): void {
        this.entities.unregisterPosition(this.character);
    }

    /**
     * Callback for every step the character takes (every time they move to a new tile). We must
     * update their position to the attackers and followers, as well as send a packet to the
     * server containing their positions.
     */

    protected handleStep(): void {
        this.entities.registerPosition(this.character);

        // Iterate through the attackers and ensure they're pursuing this character.
        this.handleAttackers();

        // Essentially the same as the above, but for followers.
        this.handleFollowers();

        // Update position of the character to the server if they have a target or attackers.
        if (
            (this.character.isMob() || this.character.isPet()) &&
            (this.character.hasTarget() || this.character.hasAttackers())
        )
            this.game.socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Entity,
                targetInstance: this.character.instance,
                requestX: this.character.gridX,
                requestY: this.character.gridY
            });

        /**
         * This handles attacking using ranged projectiles. If the character has a target
         * and it's within attack range distance we stop the movement.
         */

        // Check if we can initiate combat.
        if (this.character.moving && this.character.canAttackTarget()) this.character.stop();
    }

    /**
     * Second step is called every... second step the character takes. This is implemented
     * in the player handler subclass.
     */

    protected handleSecondStep(): void {
        // log.info('Unimplemented handleSecondStep');
    }

    /**
     * Updates the moving state for the character. The player subclass may
     * implement this function differently and will be responsible for sending
     * packets, updating camera, verifying distances, and more.
     * @param _x The x grid coordinate of the tile the player stopped on.
     * @param _y The y grid coordinate of the tile the player stopped on.
     */

    protected handleStopPathing(_x: number, _y: number): void {
        this.entities.registerPosition(this.character);
        this.character.moving = false;
    }

    /**
     * Unimplemented base function that gets called for every pixel that the character moves.
     */

    protected handleMove(): void {
        // log.info('Unimplemented handleMove');
    }

    /**
     * Because the server is not yet calculating pathfinding, we use a fallback
     * to teleport a character that the server moved to a tile to which pathfinding
     * is not possible. This will be removed once the server does pathfinding.
     * @param x The requested x grid coordinate.
     * @param y The requested y grid coordinate.
     */

    protected handleFallback(x: number, y: number): void {
        this.game.teleport(this.character, x, y);
    }

    /**
     * Iterates through all the attackers and makes sure they are following
     * this current character. We are extracting this function in particular
     * to allow its use in subclasses.
     */

    protected handleAttackers(): void {
        this.character.forEachAttacker((attacker) => {
            // Clear the attackers if their target doesn't match this character (or it doesn't exist).
            if (attacker.target?.instance !== this.character.instance)
                return this.character.removeAttacker(attacker);

            // If the attacker is too far away from the target, make them follow their target.
            if (!attacker.canAttackTarget()) attacker.follow(this.character);
        });
    }

    /**
     * Resposnible for going through each follower and making sure
     * they are following this current character. We are extracting
     * this function in particular to allow its use in subclasses.
     */

    protected handleFollowers(): void {
        this.character.forEachFollower((follower: Character) => {
            // Clear the followers if their target doesn't match this character (or it doesn't exist).
            if (!follower.target || follower.target.instance !== this.character.instance)
                return this.character.removeFollower(follower);

            follower.follow(this.character);
        });
    }
}
