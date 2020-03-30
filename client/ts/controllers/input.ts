/* global Modules, log, _, Detect, Packets */

import $ from 'jquery';
import Animation from '../entity/animation';
import Chat from './chat';
import Overlay from './overlay';
import Modules from '../utils/modules';
import Packets from '../network/packets';

export default class Input {
    game: any;
    app: any;
    renderer: any;
    map: any;
    selectedCellVisible: boolean;
    previousClick: {};
    cursorVisible: boolean;
    targetVisible: boolean;
    selectedX: number;
    selectedY: number;
    cursor: any;
    newCursor: any;
    targetData: any;
    targetColour: any;
    newTargetColour: any;
    mobileTargetColour: string;
    keyMovement: boolean;
    cursorMoved: boolean;
    previousKey: {};
    cursors: { [key: string]: any };
    lastMousePosition: { [key: string]: any };
    hovering: any;
    hoveringEntity: any;
    mouse: { [key: string]: any };
    targetAnimation: Animation;
    chatHandler: Chat;
    overlay: Overlay;
    constructor(game) {
        this.game = game;
        this.app = game.app;
        this.renderer = game.renderer;
        this.map = game.map;

        this.selectedCellVisible = false;
        this.previousClick = {};
        this.cursorVisible = true;
        this.targetVisible = true;
        this.selectedX = -1;
        this.selectedY = -1;

        this.cursor = null;
        this.newCursor = null;

        this.targetData = null;
        this.targetColour = null;
        this.newTargetColour = null;
        this.mobileTargetColour = 'rgba(51, 255, 0)';

        this.keyMovement = true;
        this.cursorMoved = false;

        this.previousKey = {};

        this.cursors = {};

        this.lastMousePosition = { x: 0, y: 0 };

        this.hovering = null;
        this.hoveringEntity = null; // for debugging

        this.mouse = {
            x: 0,
            y: 0
        };

        this.load();
    }

    load() {
        /**
         * This is the animation for the target
         * cell spinner sprite (only on desktop)
         */

        this.targetAnimation = new Animation('move', 4, 0, 16, 16);
        this.targetAnimation.setSpeed(50);

        this.chatHandler = new Chat(this.game);
        this.overlay = new Overlay(this);
    }

    loadCursors() {
        this.cursors.hand = this.game.getSprite('hand');
        this.cursors.sword = this.game.getSprite('sword');
        this.cursors.loot = this.game.getSprite('loot');
        this.cursors.target = this.game.getSprite('target');
        this.cursors.arrow = this.game.getSprite('arrow');
        this.cursors.talk = this.game.getSprite('talk');
        this.cursors.spell = this.game.getSprite('spell');
        this.cursors.bow = this.game.getSprite('bow');

        this.newCursor = this.cursors.hand;
        this.newTargetColour = 'rgba(255, 255, 255, 0.5)';

        if (this.game.isDebug()) console.info('Loaded Cursors!');
    }

    handle(inputType, data) {
        const player = this.getPlayer();

        switch (inputType) {
            case Modules.InputType.Key:
                if (this.chatHandler.isActive()) {
                    this.chatHandler.key(data);
                    return;
                }

                switch (data) {
                    case Modules.Keys.W:
                    case Modules.Keys.Up:
                        player.moveUp = true;

                        break;

                    case Modules.Keys.A:
                    case Modules.Keys.Left:
                        player.moveLeft = true;

                        break;

                    case Modules.Keys.S:
                    case Modules.Keys.Down:
                        player.moveDown = true;

                        break;

                    case Modules.Keys.D:
                    case Modules.Keys.Right:
                        player.moveRight = true;

                        break;

                    case Modules.Keys.Spacebar:
                        if (player.moving) break;

                        if (!player.isRanged()) break;

                        player.frozen = true;

                        this.updateFrozen(player.frozen);

                        break;

                    case Modules.Keys.Slash:
                        this.chatHandler.input.val('/');

                    case Modules.Keys.Enter:
                        this.chatHandler.toggle();

                        break;

                    case Modules.Keys.I:
                        this.game.interface.inventory.open();

                        break;

                    case Modules.Keys.M:
                        this.game.interface.warp.open();

                        break;

                    case Modules.Keys.P:
                        this.game.interface.profile.open();

                        break;

                    case Modules.Keys.Esc:
                        this.game.interface.profile.settings.open();

                        break;
                }

                break;

            case Modules.InputType.LeftClick:
                player.disableAction = false;
                this.keyMovement = false;

                this.setCoords(data);
                this.click(this.getCoords());

                break;
        }
    }

    keyUp(key) {
        const player = this.getPlayer();

        switch (key) {
            case Modules.Keys.W:
            case Modules.Keys.Up:
                player.moveUp = false;

                break;

            case Modules.Keys.A:
            case Modules.Keys.Left:
                player.moveLeft = false;

                break;

            case Modules.Keys.S:
            case Modules.Keys.Down:
                player.moveDown = false;

                break;

            case Modules.Keys.D:
            case Modules.Keys.Right:
                player.moveRight = false;

                break;

            case Modules.Keys.Spacebar:
                if (player.moving) break;

                if (!player.isRanged()) break;

                player.frozen = false;

                this.updateFrozen(player.frozen);

                break;
        }

        player.disableAction = false;
    }

    keyMove(position) {
        const player = this.getPlayer();

        if (!player.hasPath()) {
            this.keyMovement = true;
            this.cursorMoved = false;

            if (this.game.isDebug()) {
                console.info('--- keyMove ---');
                console.info(position);
                console.info('---------------');
            }

            this.click(position);
        }
    }

    click(position) {
        const player = this.getPlayer();

        if (player.stunned) return;

        this.setPassiveTarget();

        /**
         * It can be really annoying having the chat open
         * on mobile, and it is far harder to control.
         */

        if (
            this.renderer.mobile &&
            this.chatHandler.input.is(':visible') &&
            this.chatHandler.input.val() === ''
        )
            this.chatHandler.hideInput();

        if (this.map.isOutOfBounds(position.x, position.y)) return;

        if (
            (this.game.zoning && this.game.zoning.direction) ||
            player.disableAction
        )
            return;

        this.getActions().hidePlayerActions();

        if (this.game.interface) this.game.interface.hideAll();

        if (this.map.isObject(position.x, position.y)) {
            player.setObjectTarget(position.x, position.y);
            player.followPosition(position.x, position.y);

            return;
        }

        const entity = this.game.getEntityAt(
            position.x,
            position.y,
            position.x === player.gridX && position.y === player.gridY
        );

        if (entity) {
            player.disableAction = true;

            this.setAttackTarget();

            if (this.isTargetable(entity)) player.setTarget(entity);

            if (
                player.getDistance(entity) < 7 &&
                player.isRanged() &&
                this.isAttackable(entity)
            ) {
                this.game.socket.send(Packets.Target, [
                    Packets.TargetOpcode.Attack,
                    entity.id
                ]);
                player.lookAt(entity);
                return;
            }

            if (entity.gridX === player.gridX && entity.gridY === player.gridY)
                this.game.socket.send(Packets.Target, [
                    Packets.TargetOpcode.Attack,
                    entity.id
                ]);

            if (entity.type === 'player') {
                this.getActions().showPlayerActions(
                    entity,
                    this.mouse.x,
                    this.mouse.y
                );
                return;
            }

            if (this.isTargetable(entity)) {
                player.follow(entity);
                return;
            }
        } else player.removeTarget();

        player.go(position.x, position.y);
    }

    updateCursor() {
        if (!this.cursorVisible) return;

        if (this.newCursor !== this.cursor) this.cursor = this.newCursor;

        if (this.newTargetColour !== this.targetColour)
            this.targetColour = this.newTargetColour;
    }

    moveCursor() {
        if (!this.renderer || this.renderer.mobile || !this.renderer.camera)
            return;

        const position = this.getCoords();
        const player = this.getPlayer();
        const entity = this.game.getEntityAt(
            position.x,
            position.y,
            player.gridX === position.x && player.gridY === position.y
        );

        this.overlay.update(entity);

        if (this.renderer.debugging) this.hoveringEntity = entity;

        if (!entity || entity.id === player.id) {
            if (this.map.isObject(position.x, position.y)) {
                this.setCursor(this.cursors.talk);
                this.hovering = Modules.Hovering.Object;
            } else {
                this.setCursor(this.cursors.hand);
                this.hovering = null;
            }
        } else {
            switch (entity.type) {
                case 'item':
                case 'chest':
                    this.setCursor(this.cursors.loot);
                    this.hovering = Modules.Hovering.Item;
                    break;

                case 'mob':
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Mob;
                    break;

                case 'npc':
                    this.setCursor(this.cursors.talk);
                    this.hovering = Modules.Hovering.NPC;
                    break;

                case 'player':
                    if (entity.pvp && this.game.pvp) {
                        this.setCursor(this.getAttackCursor());
                        this.hovering = Modules.Hovering.Player;
                    }

                    break;
            }
        }
    }

    setPosition(x, y) {
        this.selectedX = x;
        this.selectedY = y;
    }

    setCoords(event) {
        const offset = this.app.canvas.offset();
        const width = this.renderer.background.width;
        const height = this.renderer.background.height;

        this.cursorMoved = false;

        this.mouse.x = Math.round(event.pageX - offset.left);
        this.mouse.y = Math.round(event.pageY - offset.top);

        if (this.mouse.x >= width) this.mouse.x = width - 1;
        else if (this.mouse.x <= 0) this.mouse.x = 0;

        if (this.mouse.y >= height) this.mouse.y = height - 1;
        else if (this.mouse.y <= 0) this.mouse.y = 0;
    }

    setCursor(cursor) {
        if (cursor) this.newCursor = cursor;
        else console.error('Cursor: ' + cursor + ' could not be found.');
    }

    setAttackTarget() {
        this.targetAnimation.setRow(1);
        this.mobileTargetColour = 'rgb(255, 51, 0)';
    }

    setPassiveTarget() {
        this.targetAnimation.setRow(0);
        this.mobileTargetColour = 'rgb(51, 255, 0)';
    }

    getAttackCursor() {
        return this.cursors[this.getPlayer().isRanged() ? 'bow' : 'sword'];
    }

    getCoords() {
        if (!this.renderer || !this.renderer.camera) return;

        const tileScale =
            this.renderer.tileSize * this.renderer.getSuperScaling();
        const offsetX = this.mouse.x % tileScale;
        const offsetY = this.mouse.y % tileScale;
        const x =
            (this.mouse.x - offsetX) / tileScale + this.game.getCamera().gridX;
        const y =
            (this.mouse.y - offsetY) / tileScale + this.game.getCamera().gridY;

        return {
            x: x,
            y: y
        };
    }

    getTargetData() {
        const frame = this.targetAnimation.currentFrame;
        const superScale = this.renderer.getSuperScaling();
        const sprite = this.game.getSprite('target');

        if (!sprite.loaded) sprite.load();

        return (this.targetData = {
            sprite: sprite,
            x: frame.x * superScale,
            y: frame.y * superScale,
            width: sprite.width * superScale,
            height: sprite.height * superScale,
            dx: this.selectedX * 16 * superScale,
            dy: this.selectedY * 16 * superScale,
            dw: sprite.width * superScale,
            dh: sprite.height * superScale
        });
    }

    updateFrozen(state) {
        this.game.socket.send(Packets.Movement, [
            Packets.MovementOpcode.Freeze,
            state
        ]);
    }

    isTargetable(entity) {
        return (
            this.isAttackable(entity) ||
            entity.type === 'npc' ||
            entity.type === 'chest'
        );
    }

    isAttackable(entity) {
        return (
            entity.type === 'mob' ||
            (entity.type === 'player' && entity.pvp && this.game.pvp)
        );
    }

    getPlayer() {
        return this.game.player;
    }

    getActions() {
        return this.game.interface.actions;
    }
};
