import { Packets, Opcodes } from '@kaetram/common/network';

import log from '../../../lib/log';

import type Game from '../../../game';
import type Player from './player';

export default class PlayerHandler {
    private map;
    private camera;
    private input;
    private entities;
    private socket;
    private renderer;

    public constructor(private game: Game, private player: Player) {
        let { map, input, entities, socket, renderer } = game;

        this.map = map;
        this.camera = game.getCamera();
        this.input = input;
        this.entities = entities;
        this.socket = socket;
        this.renderer = renderer;

        this.load();
    }

    private load(): void {
        let { player, game, map, camera, input, entities, socket, renderer } = this;

        player.onRequestPath((x, y) => {
            if (player.dead || player.frozen) return null;

            /**
             * If the position is the same as the player's current position
             * we will return nothing. Otherwise this will just create
             * a colliding tile and will interfere with combat.
             */

            let isObject = map.isObject(x, y);

            if (player.gridX === x && player.gridY === y) return [];

            let ignores = [player];

            if (!map.isColliding(x, y) && !isObject)
                socket.send(Packets.Movement, {
                    opcode: Opcodes.Movement.Request,
                    requestX: x,
                    requestY: y,
                    playerX: player.gridX,
                    playerY: player.gridY
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
            if (!input) return;

            let i = path.length - 1;

            player.moving = true;

            [input.selectedX, input.selectedY] = path[i];
            input.selectedCellVisible = true;

            log.debug(`Movement speed: ${player.movementSpeed}`);

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Started,
                requestX: input.selectedX,
                requestY: input.selectedY,
                playerX: player.gridX,
                playerY: player.gridY,
                movementSpeed: player.movementSpeed,
                targetInstance: this.getTargetId()
            });
        });

        player.onStopPathing((x, y) => {
            if (!input) return;

            entities.unregisterPosition(player);
            entities.registerPosition(player);

            input.selectedCellVisible = false;

            camera.clip();

            let instance = '',
                entity = game.getEntityAt(x, y, true);

            if (entity) ({ instance } = entity);

            log.debug('Stopping pathing.');

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Stop,
                playerX: x,
                playerY: y,
                targetInstance: instance,
                hasTarget: !!player.target,
                orientation: player.orientation
            });

            socket.send(Packets.Target, [this.getTargetType(), this.getTargetId()]);

            if (player.target) {
                player.lookAt(player.target);

                if (player.target.isObject()) player.removeTarget();
            }

            input.setPassiveTarget();

            game.storage.setOrientation(player.orientation);

            player.moving = false;
        });

        player.onBeforeStep(() => entities.unregisterPosition(player));

        player.onStep(() => {
            if (player.hasNextStep()) entities.registerDuality(player);

            if (!camera.centered || camera.lockX || camera.lockY) this.checkBounds();

            socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Step,
                playerX: player.gridX,
                playerY: player.gridY
            });

            if (!this.isAttackable()) return;

            if (player.target)
                if (player.isRanged()) {
                    if (player.getDistance(player.target) < 7) player.stop(true);
                } else input.setPosition(player.target.gridX, player.target.gridY);
        });

        player.onSecondStep(() => renderer.updateAnimatedTiles());

        player.onMove(() => {
            /**
             * This is a callback representing the absolute exact position of the player.
             */

            if (camera.centered) camera.centreOn(player);

            if (player.target) player.follow(player.target);
        });

        player.onEquipment(() => {
            if (game.menu && game.menu.profile) game.menu.profile.update();
        });
    }

    isAttackable(): boolean {
        let { target } = this.player;

        return target ? target.isMob() || (target.isPlayer() && target.pvp) : false;
    }

    checkBounds(): void {
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

    private getTargetId(): string | null {
        let { target } = this.player;

        return target ? target.instance : null;
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
