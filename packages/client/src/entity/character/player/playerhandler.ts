import { Opcodes, Packets } from '@kaetram/common/network';

import type EntitiesController from '../../../controllers/entities';
import type InputController from '../../../controllers/input';
import type Game from '../../../game';
import type Map from '../../../map/map';
import type Socket from '../../../network/socket';
import type Camera from '../../../renderer/camera';
import type Renderer from '../../../renderer/renderer';
import type Player from './player';

/**
 * THIS WHOLE CLASS IS GONNA BE REFACTORED
 */

export default class PlayerHandler {
    private lastStepX = -1;
    private lastStepY = -1;

    private map: Map;
    private camera: Camera;
    private input: InputController;
    private entities: EntitiesController;
    private socket: Socket;
    private renderer: Renderer;

    public constructor(private game: Game, private player: Player) {
        this.map = game.map;
        this.camera = game.camera;
        this.input = game.input;
        this.entities = game.entities;
        this.socket = game.socket;
        this.renderer = game.renderer;

        this.load();
    }

    private load(): void {
        let { player, game, map, camera, input, entities, socket, renderer, lastStepX, lastStepY } =
            this;

        player.onRequestPath((x, y) => {
            if (player.dead || player.frozen) return null;

            if (player.canAttackTarget() && !player.trading) return null;

            /**
             * If the position is the same as the player's current position
             * we will return nothing. Otherwise this will just create
             * a colliding tile and will interfere with combat.
             */

            let isObject = map.isObject(x, y),
                ignores = [];

            if (!map.isColliding(x, y) && !isObject)
                socket.send(Packets.Movement, {
                    opcode: Opcodes.Movement.Request,
                    requestX: x,
                    requestY: y,
                    playerX: player.gridX,
                    playerY: player.gridY,
                    targetInstance: player.target?.instance,
                    following: player.following
                });

            if (isObject)
                ignores.push({
                    hasPath() {
                        return false;
                    },
                    gridX: x,
                    gridY: y
                } as Player);

            return game.findPath(player, x, y, ignores);
        });

        player.onStartPathing((path) => {
            let i = path.length - 1;

            player.moving = true;

            [input.selectedX, input.selectedY] = path[i];
            input.selectedCellVisible = true;

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Started,
                requestX: input.selectedX,
                requestY: input.selectedY,
                playerX: player.gridX,
                playerY: player.gridY,
                movementSpeed: player.movementSpeed,
                targetInstance: player.target?.instance
            });
        });

        player.onStopPathing((x, y) => {
            entities.registerPosition(player);

            input.selectedCellVisible = false;

            camera.clip();

            let instance = player.target?.instance || game.getEntityAt(x, y)?.instance;

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Stop,
                playerX: x,
                playerY: y,
                targetInstance: instance,
                orientation: player.orientation
            });

            if (player.trading)
                socket.send(Packets.Trade, {
                    opcode: Opcodes.Trade.Request,
                    instance: player.target?.instance
                });

            socket.send(Packets.Target, [
                this.getTargetType(),
                player.target ? player.target.instance : ''
            ]);

            if (player.target) {
                player.lookAt(player.target);

                if (player.target.isObject()) player.removeTarget();

                player.disableAction = true;
            }

            input.setPassiveTarget();

            game.storage.setOrientation(player.orientation);

            if (!player.hasKeyboardMovement()) game.renderer.resetAnimatedTiles();

            player.moving = false;
            player.trading = false;
        });

        player.onBeforeStep(() => entities.unregisterPosition(player));

        player.onStep(() => {
            // Update the position if there is any pathing left.
            if (player.hasNextStep()) entities.registerPosition(player);

            // Check the zoning bounds - reachign the bounds moves the screen according to which border.
            if (!camera.isCentered() || camera.lockX || camera.lockY) this.checkBounds();

            // Prevent sending double packets to the server.
            if (lastStepX === player.gridX && lastStepY === player.gridY) return;

            // Send a step movement packet to the server.
            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Step,
                playerX: player.gridX,
                playerY: player.gridY,
                timestamp: Date.now()
            });

            lastStepX = player.gridX;
            lastStepY = player.gridY;

            if (player.canAttackTarget() && !player.trading) player.stop(true);
        });

        // Refresh animated tiles every second step.
        player.onSecondStep(() => renderer.updateAnimatedTiles());

        // Centre the camera on the player every pixel the player moves
        player.onMove(() => {
            if (camera.isCentered()) camera.centreOn(player);
        });
    }

    private isAttackable(): boolean {
        let { target } = this.player;

        return target ? target.isMob() || (target.isPlayer() && this.game.pvp) : false;
    }

    private checkBounds(): void {
        let { player, camera, game, socket, renderer } = this,
            { zoning } = game;
        if (!zoning) return;

        let x = player.gridX - camera.gridX,
            y = player.gridY - camera.gridY;

        if (x === 0) zoning.setLeft();
        else if (y === 0) zoning.setUp();
        else if (x === camera.gridWidth - 2) zoning.setRight();
        else if (y === camera.gridHeight - 2) zoning.setDown();

        if (zoning.direction !== null) {
            let direction = zoning.getDirection();

            camera.zone(direction);

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Zone,
                direction
            });

            renderer.updateAnimatedTiles();

            zoning.reset();
        }
    }

    private getTargetType(): Opcodes.Target {
        let { target } = this.player;

        if (!target) return Opcodes.Target.None;

        if (this.isAttackable()) return Opcodes.Target.Attack;

        if (target.isNPC() || target.isChest()) return Opcodes.Target.Talk;

        if (target.isObject()) return Opcodes.Target.Object;

        return Opcodes.Target.None;
    }
}
