/* global log, Packets, Modules */

import Packets from '../../../network/packets';

/**
 * This is a player handler, responsible for all the callbacks
 * without having to clutter up the entire game file.
 */

export default class PlayerHandler {
    game: any;
    map: any;
    camera: any;
    input: any;
    player: any;
    entities: any;
    socket: any;
    renderer: any;
    constructor(game, player) {
        this.game = game;
        this.map = game.map;
        this.camera = game.getCamera();
        this.input = game.input;
        this.player = player;
        this.entities = game.entities;
        this.socket = game.socket;
        this.renderer = game.renderer;

        this.load();
    }

    load() {
        this.player.onRequestPath(function(x, y) {
            if (this.player.dead || this.player.frozen) return null;

            const ignores = [this.player];

            if (!this.game.map.isColliding(x, y))
                this.socket.send(Packets.Movement, [
                    Packets.MovementOpcode.Request,
                    x,
                    y,
                    this.player.gridX,
                    this.player.gridY
                ]);

            return this.game.findPath(this.player, x, y, ignores);
        });

        this.player.onStartPathing(function(path) {
            const i = path.length - 1;

            this.player.moving = true;

            this.input.selectedX = path[i][0];
            this.input.selectedY = path[i][1];
            this.input.selectedCellVisible = true;

            if (this.game.isDebug())
                console.info('Movement speed: ' + this.player.movementSpeed);

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Started,
                this.input.selectedX,
                this.input.selectedY,
                this.player.gridX,
                this.player.gridY,
                this.player.movementSpeed
            ]);
        });

        this.player.onStopPathing(function(x, y) {
            this.entities.unregisterPosition(this.player);
            this.entities.registerPosition(this.player);

            this.input.selectedCellVisible = false;

            this.camera.clip();

            let id = null;
            const entity = this.game.getEntityAt(x, y, true);

            if (entity) id = entity.id;

            if (this.game.isDebug()) console.info('Stopping pathing.');

            const hasTarget = this.player.hasTarget();

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Stop,
                x,
                y,
                id,
                hasTarget,
                this.player.orientation
            ]);

            this.socket.send(Packets.Target, [
                this.getTargetType(),
                this.getTargetId()
            ]);

            if (hasTarget) {
                this.player.lookAt(this.player.target);

                if (this.player.target.type === 'object')
                    this.player.removeTarget();
            }

            this.input.setPassiveTarget();

            this.game.storage.setOrientation(this.player.orientation);

            this.player.moving = false;
        });

        this.player.onBeforeStep(() => {
            this.entities.unregisterPosition(this.player);

            if (!this.isAttackable()) return;

            if (this.player.isRanged()) {
                if (this.player.getDistance(this.player.target) < 7)
                    this.player.stop();
            } else {
                this.input.selectedX = this.player.target.gridX;
                this.input.selectedY = this.player.target.gridY;
            }
        });

        this.player.onStep(() => {
            if (this.player.hasNextStep())
                this.entities.registerDuality(this.player);

            if (!this.camera.centered || this.camera.lockX || this.camera.lockY)
                this.checkBounds();

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Step,
                this.player.gridX,
                this.player.gridY
            ]);
        });

        this.player.onSecondStep(() => {
            this.renderer.updateAnimatedTiles();
        });

        this.player.onMove(() => {
            /**
             * This is a callback representing the absolute exact position of the player.
             */

            if (this.camera.centered) this.camera.centreOn(this.player);

            if (this.player.hasTarget()) this.player.follow(this.player.target);
        });

        this.player.onUpdateArmour(function(armourName, power) {
            this.player.setSprite(this.game.getSprite(armourName));

            if (this.game.interface && this.game.interface.profile)
                this.game.interface.profile.update();
        });

        this.player.onUpdateEquipment(function(type, power) {
            if (this.game.interface && this.game.interface.profile)
                this.game.interface.profile.update();
        });
    }

    isAttackable() {
        const target = this.player.target;

        if (!target) return;

        return (
            target.type === 'mob' || (target.type === 'player' && target.pvp)
        );
    }

    checkBounds() {
        const x = this.player.gridX - this.camera.gridX;
        const y = this.player.gridY - this.camera.gridY;

        if (x === 0) this.game.zoning.setLeft();
        else if (y === 0) this.game.zoning.setUp();
        else if (x === this.camera.gridWidth - 2) this.game.zoning.setRight();
        else if (y === this.camera.gridHeight - 2) this.game.zoning.setDown();

        if (this.game.zoning.direction !== null) {
            const direction = this.game.zoning.getDirection();

            this.camera.zone(direction);

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Zone,
                direction
            ]);

            this.renderer.updateAnimatedTiles();

            this.game.zoning.reset();
        }
    }

    getTargetId() {
        return this.player.target ? this.player.target.id : null;
    }

    getTargetType() {
        const target = this.player.target;

        if (!target) return Packets.TargetOpcode.None;

        if (this.isAttackable()) return Packets.TargetOpcode.Attack;

        if (target.type === 'npc') return Packets.TargetOpcode.Talk;

        if (target.type === 'object') return Packets.TargetOpcode.Object;

        return Packets.TargetOpcode.None;
    }
}
