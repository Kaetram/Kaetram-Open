import EntitiesController from '../../../controllers/entities';
import InputController from '../../../controllers/input';
import Game from '../../../game';
import log from '../../../lib/log';
import Map from '../../../map/map';
import Packets from '@kaetram/common/src/packets';
import Socket from '../../../network/socket';
import Camera from '../../../renderer/camera';
import Renderer from '../../../renderer/renderer';
import Player from './player';

export default class PlayerHandler {
    game: Game;
    map: Map;
    camera: Camera;
    input: InputController;
    player: Player;
    entities: EntitiesController;
    socket: Socket;
    renderer: Renderer;

    constructor(game: Game, player: Player) {
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

    load(): void {
        this.player.onRequestPath((x, y) => {
            if (this.player.dead || this.player.frozen) return null;

            /**
             * If the position is the same as the player's current position
             * we will return nothing. Otherwise this will just create
             * a colliding tile and will interfere with combat.
             */

            let ignores = [];
            const isObject = this.map.isObject(x, y);

            if (this.player.gridX === x && this.player.gridY === y) return ignores;

            ignores = [this.player];

            if (!this.map.isColliding(x, y) && !isObject)
                this.socket.send(Packets.Movement, [
                    Packets.MovementOpcode.Request,
                    x,
                    y,
                    this.player.gridX,
                    this.player.gridY
                ]);

            if (isObject)
                ignores.push({
                    hasPath() {
                        return false;
                    },
                    gridX: x,
                    gridY: y
                });

            return this.game.findPath(this.player, x, y, ignores);
        });

        this.player.onStartPathing((path) => {
            const i = path.length - 1;

            this.player.moving = true;

            this.input.selectedX = path[i][0];
            this.input.selectedY = path[i][1];
            this.input.selectedCellVisible = true;

            log.debug(`Movement speed: ${this.player.movementSpeed}`);

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Started,
                this.input.selectedX,
                this.input.selectedY,
                this.player.gridX,
                this.player.gridY,
                this.player.movementSpeed,
                this.getTargetId()
            ]);
        });

        this.player.onStopPathing((x, y) => {
            this.entities.unregisterPosition(this.player);
            this.entities.registerPosition(this.player);

            this.input.selectedCellVisible = false;

            this.camera.clip();

            let id = null;
            const entity = this.game.getEntityAt(x, y, true);

            if (entity) id = entity.id;

            log.debug('Stopping pathing.');

            const hasTarget = this.player.hasTarget();

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Stop,
                x,
                y,
                id,
                hasTarget,
                this.player.orientation
            ]);

            this.socket.send(Packets.Target, [this.getTargetType(), this.getTargetId()]);

            if (hasTarget) {
                this.player.lookAt(this.player.target);

                if (this.player.target.type === 'object') this.player.removeTarget();
            }

            this.input.setPassiveTarget();

            this.game.storage.setOrientation(this.player.orientation);

            this.player.moving = false;
        });

        this.player.onBeforeStep(() => this.entities.unregisterPosition(this.player));

        this.player.onStep(() => {
            if (this.player.hasNextStep()) this.entities.registerDuality(this.player);

            if (!this.camera.centered || this.camera.lockX || this.camera.lockY) this.checkBounds();

            this.socket.send(Packets.Movement, [
                Packets.MovementOpcode.Step,
                this.player.gridX,
                this.player.gridY
            ]);

            if (!this.isAttackable()) return;

            if (this.player.isRanged()) {
                if (this.player.getDistance(this.player.target) < 7) this.player.stop(true);
            } else {
                this.input.selectedX = this.player.target.gridX;
                this.input.selectedY = this.player.target.gridY;
            }
        });

        this.player.onSecondStep(() => this.renderer.updateAnimatedTiles());

        this.player.onMove(() => {
            /**
             * This is a callback representing the absolute exact position of the player.
             */

            if (this.camera.centered) this.camera.centreOn(this.player);

            if (this.player.hasTarget()) this.player.follow(this.player.target);
        });

        this.player.onUpdateArmour((armourName) => {
            this.player.setSprite(this.game.getSprite(armourName));

            if (this.game.menu && this.game.menu.profile) this.game.menu.profile.update();
        });

        this.player.onUpdateEquipment(() => {
            if (this.game.menu && this.game.menu.profile) this.game.menu.profile.update();
        });
    }

    isAttackable(): boolean {
        const target = this.player.target as Player;

        if (!target) return;

        return target.type === 'mob' || (target.type === 'player' && target.pvp);
    }

    checkBounds(): void {
        const x = this.player.gridX - this.camera.gridX,
            y = this.player.gridY - this.camera.gridY;

        if (x === 0) this.game.zoning.setLeft();
        else if (y === 0) this.game.zoning.setUp();
        else if (x === this.camera.gridWidth - 2) this.game.zoning.setRight();
        else if (y === this.camera.gridHeight - 2) this.game.zoning.setDown();

        if (this.game.zoning.direction !== null) {
            const direction = this.game.zoning.getDirection();

            this.camera.zone(direction);

            this.socket.send(Packets.Movement, [Packets.MovementOpcode.Zone, direction]);

            this.renderer.updateAnimatedTiles();

            this.game.zoning.reset();
        }
    }

    getTargetId(): string {
        return this.player.target ? this.player.target.id : null;
    }

    getTargetType(): number {
        const target = this.player.target;

        if (!target) return Packets.TargetOpcode.None;

        if (this.isAttackable()) return Packets.TargetOpcode.Attack;

        if (target.type === 'npc' || target.type === 'chest') return Packets.TargetOpcode.Talk;

        if (target.type === 'object') return Packets.TargetOpcode.Object;

        return Packets.TargetOpcode.None;
    }
}
