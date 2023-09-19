import CharacterHandler from '../handler';

import { Packets, Opcodes, Modules } from '@kaetram/common/network';

import type Map from '../../../map/map';
import type Player from './player';
import type Game from '../../../game';
import type EntitiesController from '../../../controllers/entities';
import type { TileIgnore } from '../../../utils/pathfinder';

export default class Handler extends CharacterHandler {
    private map: Map;

    private lastStepX = -1;
    private lastStepY = -1;

    protected override game: Game;
    protected override entities: EntitiesController;

    public constructor(protected override character: Player) {
        super(character);

        this.map = character.game.map;

        this.game = character.game;
        this.entities = character.game.entities;
    }

    /**
     * This subclass implementation is used for our current player (the one that we logged in with).
     * Here we actually send the packets to the server and handle the real game logic.
     * @param x The x grid coordinate of the tile the player clicked on.
     * @param y The y grid coordinate of the tile the player clicked on.
     * @returns The path to the new tile in a 2D array.
     */

    protected override handleRequestPath(x: number, y: number): number[][] {
        // Prevent any calculations from being made if the player clicked on the tile they are already on.
        if (this.character.gridX === x && this.character.gridY === y) return [];

        // Prevent calculations from being made if the player is dead.
        if (this.character.dead || this.character.frozen) return [];

        // Prevent calculating pathing when we target a mob that is within range.
        if (this.character.canAttackTarget() && !this.character.trading) return [];

        let isObject = this.map.isObject(x, y),
            isResource = this.character.target?.isResource();

        // Ignore requests into colliding tiles but allow targetable objects.
        if (this.map.isColliding(x, y) && !isObject && !isResource) return [];

        // Sends the packet to the server with the request.
        this.game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Request,
            requestX: x,
            requestY: y,
            playerX: this.character.gridX,
            playerY: this.character.gridY,
            targetInstance: this.character.target?.instance,
            following: this.character.following
        });

        let ignores: TileIgnore[] = [],
            cursor = '';

        // Treats an object as a character so we can path towards it.
        if (isObject) {
            ignores.push({ x, y });

            cursor = this.map.getTileCursor(x, y);

            // Little bit of a hack, but we ignore the tiles around the object for later.
            if (cursor === 'fishing')
                ignores.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
        }

        if (isResource) ignores.push({ x, y });

        return this.game.findPath(this.character, x, y, ignores, cursor);
    }

    /**
     * Updates the player's selected tile position and sends a packet to the server
     * to inform it that the player has started moving.
     * @param path Contains the array of tiles that the player will move through.
     */

    protected override handleStartPathing(path: number[][]): void {
        // The selected tile is the last tile in the path.
        [this.game.input.selectedX, this.game.input.selectedY] = path.at(-1)!;

        this.character.moving = true;
        this.game.input.selectedCellVisible = true;

        this.game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Started,
            requestX: this.game.input.selectedX,
            requestY: this.game.input.selectedY,
            playerX: this.character.gridX,
            playerY: this.character.gridY,
            movementSpeed: this.character.movementSpeed,
            targetInstance: this.character.target?.instance
        });
    }

    /**
     * Subclass implementation of the stop pathing handler. We update all the necessary
     * information regarding input and player's actions here.
     * @param x The x grid coordinate of the tile the player stopped on.
     * @param y The y grid coordinate of the tile the player stopped on.
     */

    protected override handleStopPathing(x: number, y: number): void {
        this.entities.registerPosition(this.character);

        // Once stopped, remove the selected tile animation.
        this.game.input.selectedCellVisible = false;

        // Sends the stop pathing packet to the server
        this.game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Stop,
            playerX: this.character.gridX,
            playerY: this.character.gridY,
            targetInstance:
                this.character.target?.instance || this.game.getEntityAt(x, y)?.instance,
            orientation: this.character.orientation
        });

        if (this.character.trading)
            this.game.socket.send(Packets.Trade, {
                opcode: Opcodes.Trade.Request,
                instance: this.character.target?.instance
            });

        let targetType = this.getTargetType();

        // Send target packet only if we have a target.
        if (targetType !== Opcodes.Target.None)
            this.game.socket.send(Packets.Target, [
                this.getTargetType(),
                this.character.target?.instance || ''
            ]);

        // ---------------------------------------------------------

        if (this.character.target) {
            // Orient the player towards the target.
            this.character.lookAt(this.character.target);

            // Remove the target when we target objects.
            if (this.character.target.isObject()) this.character.removeTarget();

            // Disable keyboard movement until we let go.
            (this.character as Player).disableAction = true;
        }

        this.game.input.setPassiveTarget();

        // Save the player's orientation.
        this.game.storage.setOrientation(this.character.orientation);

        // Default to idling state once we stop pathing.
        if (!this.character.hasKeyboardMovement())
            this.character.performAction(this.character.orientation, Modules.Actions.Idle);

        // Reset movement and trading variables
        this.character.moving = false;
        this.character.trading = false;
    }

    /**
     * Called for every transition of the player from one tile to another. We synchronizew
     * the camera and update the boundaries (if we don't use centred camera). We also send
     * a packet to the server to inform it that the player has moved. Lastly we check
     * if the player can initiate combat (if they targeted an entity).
     */

    protected override handleStep(): void {
        // While we have tiles left in our pathing we register the character's position
        if (this.character.hasNextStep()) this.entities.registerPosition(this.character);

        // Check zoning boundaries if we're using a non-centered camera.
        if (!this.game.camera.isCentered()) this.game.updateCameraBounds();

        // Used to prevent sending double packets.
        if (this.lastStepX === this.character.gridX && this.lastStepY === this.character.gridY)
            return;

        // Handle attackers
        this.handleAttackers();

        // Handle followers
        this.handleFollowers();

        if (this.character.hasTarget())
            this.game.socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Entity,
                targetInstance: this.character.target?.instance,
                requestX: this.character.target?.gridX,
                requestY: this.character.target?.gridY
            });

        // Send the packet to the server to inform it that the player has moved.
        this.game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Step,
            playerX: this.character.gridX,
            playerY: this.character.gridY,
            nextGridX: this.character.nextGridX,
            nextGridY: this.character.nextGridY,
            timestamp: Date.now()
        });

        // Update the last step coordinates.
        this.lastStepX = this.character.gridX;
        this.lastStepY = this.character.gridY;

        // Check if we can initiate combat.
        if (this.character.canAttackTarget()) this.character.stop();
    }

    /**
     * Updates the camera position to center on the player.
     */

    protected override handleMove(): void {
        if (!this.game.camera.isCentered()) return;

        this.game.camera.centreOn(this.character);
    }

    /**
     * This is a temporary function until we move unncessary packets to be handled by the
     * server side and update the client-side targeting system. This essentially checks
     * what type of interaction the player is doing.
     * @returns The interaction type.
     */

    private getTargetType(): Opcodes.Target {
        if (!this.character.target) return Opcodes.Target.None;

        // Interaction type for npc and chests.
        if (this.character.target.isNPC() || this.character.target.isChest())
            return Opcodes.Target.Talk;

        // Interaction type for objects.
        if (this.character.target.isObject() || this.character.target.isResource())
            return Opcodes.Target.Object;

        // Interaction for attacking
        if (this.character.target.isMob() || (this.character.target.isPlayer() && this.game.pvp))
            return Opcodes.Target.Attack;

        return Opcodes.Target.None;
    }
}
