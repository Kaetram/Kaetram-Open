import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import Animation from '../entity/animation';
import log from '../lib/log';
import Actions from '../menu/actions';
import Chat from './chat';
import Overlay from './overlay';

import type Character from '../entity/character/character';
import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';

type Cursors = 'hand' | 'sword' | 'loot' | 'target' | 'arrow' | 'talk' | 'spell' | 'bow' | 'axe';

interface TargetData {
    sprite: Sprite;
    x: number;
    y: number;
    width: number;
    height: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
}

export default class InputController {
    app = this.game.app;
    renderer = this.game.renderer;
    map = this.game.map;

    selectedCellVisible = false;
    cursorVisible = true;
    targetVisible = true;
    selectedX = -1;
    selectedY = -1;

    cursor!: Sprite;
    newCursor!: Sprite;

    targetData!: TargetData;
    targetColour!: string;
    newTargetColour!: string;

    mobileTargetColour = 'rgba(51, 255, 0)';
    keyMovement = true;
    cursorMoved = false;

    cursors: { [cursor in Cursors]?: Sprite } = {};
    lastMousePosition: Pos = { x: 0, y: 0 };

    hovering!: number | null;
    hoveringEntity!: Entity; // for debugging

    mouse: Pos = { x: 0, y: 0 };

    /**
     * This is the animation for the target
     * cell spinner sprite (only on desktop)
     */
    targetAnimation!: Animation;
    chatHandler!: Chat;
    overlay!: Overlay;
    entity!: Entity | undefined;

    constructor(public game: Game) {
        this.load();
    }

    load(): void {
        this.targetAnimation = new Animation('move', 4, 0, 16, 16);
        this.targetAnimation.setSpeed(50);

        this.chatHandler = new Chat(this.game);
        this.overlay = new Overlay(this);
    }

    loadCursors(): void {
        this.cursors.hand = this.game.getSprite('hand');
        this.cursors.sword = this.game.getSprite('sword');
        this.cursors.loot = this.game.getSprite('loot');
        this.cursors.target = this.game.getSprite('target');
        this.cursors.arrow = this.game.getSprite('arrow');
        this.cursors.talk = this.game.getSprite('talk');
        this.cursors.spell = this.game.getSprite('spell');
        this.cursors.bow = this.game.getSprite('bow');
        this.cursors.axe = this.game.getSprite('axe_cursor');

        this.newCursor = this.cursors['hand'] as Sprite;
        this.newTargetColour = 'rgba(255, 255, 255, 0.5)';

        log.debug('Loaded Cursors!');
    }

    handle(inputType: Modules.InputType, data: Modules.Keys | JQuery.Event): void {
        const player = this.getPlayer();

        switch (inputType) {
            case Modules.InputType.Key:
                if (this.chatHandler.isActive()) {
                    this.chatHandler.key(data as Modules.Keys);
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
                        this.game.menu?.inventory?.open();

                        break;

                    case Modules.Keys.M:
                        this.game.menu?.warp?.open();

                        break;

                    case Modules.Keys.P:
                        this.game.menu?.profile?.open();

                        break;

                    case Modules.Keys.Esc:
                        this.game.menu?.hideAll();
                        break;
                }

                break;

            case Modules.InputType.LeftClick:
                player.disableAction = false;
                this.keyMovement = false;
                this.setCoords(data as JQuery.MouseMoveEvent);

                if ((window.event as MouseEvent).ctrlKey) {
                    log.info('Control key is pressed lmao');

                    this.game.socket?.send(Packets.Command, [
                        Packets.CommandOpcode.CtrlClick,
                        this.getCoords()
                    ]);
                    return;
                }

                this.leftClick(this.getCoords());

                break;

            case Modules.InputType.RightClick:
                this.rightClick(this.getCoords());

                break;
        }
    }

    keyUp(key: Modules.Keys): void {
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

    keyMove(position: Pos): void {
        const player = this.getPlayer();

        if (!player.hasPath()) {
            this.keyMovement = true;
            this.cursorMoved = false;

            log.debug('--- keyMove ---');
            log.debug(position);
            log.debug('---------------');

            this.leftClick(position, true);
        }
    }

    leftClick(position: Pos | undefined, keyMovement?: boolean): void {
        const player = this.getPlayer();

        if (player.stunned || !position) return;

        this.setPassiveTarget();

        /**
         * It can be really annoying having the chat open
         * on mobile, and it is far harder to control.
         */

        if (
            this.renderer?.mobile &&
            this.chatHandler.input.is(':visible') &&
            this.chatHandler.input.val() === ''
        )
            this.chatHandler.hideInput();

        if (this.map?.isOutOfBounds(position.x, position.y)) return;

        if (this.game.zoning?.direction || player.disableAction) return;

        this.game.menu?.hideAll();

        if (this.map?.isObject(position.x, position.y)) {
            player.setObjectTarget(position.x, position.y);
            player.followPosition(position.x, position.y);

            return;
        }

        if (this.renderer?.mobile || keyMovement)
            this.entity = this.game.getEntityAt(
                position.x,
                position.y,
                position.x === player.gridX && position.y === player.gridY
            );

        if (this.entity) {
            player.disableAction = true;

            this.setAttackTarget();

            if (this.isTargetable(this.entity)) player.setTarget(this.entity);

            if (
                player.getDistance(this.entity) < 7 &&
                player.isRanged() &&
                this.isAttackable(this.entity)
            ) {
                this.game.socket?.send(Packets.Target, [
                    Packets.TargetOpcode.Attack,
                    this.entity.id
                ]);
                player.lookAt(this.entity);
                return;
            }

            if (this.entity.gridX === player.gridX && this.entity.gridY === player.gridY)
                this.game.socket?.send(Packets.Target, [
                    Packets.TargetOpcode.Attack,
                    this.entity.id
                ]);

            if (this.isTargetable(this.entity)) {
                player.follow(this.entity as Character);
                return;
            }
        }

        player.removeTarget();
        player.go(position.x, position.y);
    }

    rightClick(position: Pos | undefined): void {
        if (!position) return;

        if (this.renderer?.mobile)
            this.entity = this.game.getEntityAt(
                position.x,
                position.y,
                this.isSamePosition(position)
            );

        if (this.entity) {
            const actions = this.getActions();

            actions.loadDefaults(this.entity.type, {
                mouseX: this.mouse.x,
                mouseY: this.mouse.y,
                pvp: this.entity.pvp
            });

            actions.show();
        } else if (this.hovering === Modules.Hovering.Object) {
            // TODO
        }
    }

    updateCursor(): void {
        if (!this.cursorVisible) return;

        if (this.newCursor !== this.cursor) this.cursor = this.newCursor;

        if (this.newTargetColour !== this.targetColour) this.targetColour = this.newTargetColour;
    }

    moveCursor(): void {
        if (!this.renderer || this.renderer.mobile || !this.renderer.camera) return;

        const position = this.getCoords(),
            player = this.getPlayer();

        if (!position) return;

        // The entity we are currently hovering over.
        this.entity = this.game.getEntityAt(position.x, position.y, this.isSamePosition(position));

        this.overlay.update(this.entity);

        if (!this.entity || this.entity.id === player.id)
            if (this.map?.isObject(position.x, position.y)) {
                const cursor = this.map.getTileCursor(position.x, position.y) as Cursors;

                this.setCursor(this.cursors[cursor || 'talk']);
                this.hovering = Modules.Hovering.Object;
            } else {
                this.setCursor(this.cursors['hand']);
                this.hovering = null;
            }
        else
            switch (this.entity.type) {
                case 'item':
                case 'chest':
                    this.setCursor(this.cursors['loot']);
                    this.hovering = Modules.Hovering.Item;
                    break;

                case 'mob':
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Mob;
                    break;

                case 'npc':
                    this.setCursor(this.cursors['talk']);
                    this.hovering = Modules.Hovering.NPC;
                    break;

                case 'player':
                    if (this.entity.pvp && this.game.pvp) {
                        this.setCursor(this.getAttackCursor());
                        this.hovering = Modules.Hovering.Player;
                    }

                    break;
            }
    }

    setPosition(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
    }

    setCoords(event: JQuery.MouseMoveEvent<Document>): void {
        const offset = this.app.canvas.offset() as JQuery.Coordinates,
            width = this.renderer?.background.width as number,
            height = this.renderer?.background.height as number;

        this.cursorMoved = false;

        this.mouse.x = Math.round(event.pageX - offset.left);
        this.mouse.y = Math.round(event.pageY - offset.top);

        if (this.mouse.x >= width) this.mouse.x = width - 1;
        else if (this.mouse.x <= 0) this.mouse.x = 0;

        if (this.mouse.y >= height) this.mouse.y = height - 1;
        else if (this.mouse.y <= 0) this.mouse.y = 0;
    }

    setCursor(cursor: Sprite | undefined): void {
        if (cursor) this.newCursor = cursor;
        else log.error(`Cursor: ${cursor} could not be found.`);
    }

    setAttackTarget(): void {
        this.targetAnimation.setRow(1);
        this.mobileTargetColour = 'rgb(255, 51, 0)';
    }

    setPassiveTarget(): void {
        this.targetAnimation.setRow(0);
        this.mobileTargetColour = 'rgb(51, 255, 0)';
    }

    getAttackCursor(): Sprite | undefined {
        return this.cursors[this.getPlayer().isRanged() ? 'bow' : 'sword'];
    }

    getCoords(): Pos | undefined {
        if (!this.renderer?.camera) return;

        const tileScale = this.renderer.tileSize * this.renderer.getSuperScaling(),
            offsetX = this.mouse.x % tileScale,
            offsetY = this.mouse.y % tileScale,
            camera = this.game.getCamera(),
            x = (this.mouse.x - offsetX) / tileScale + camera.gridX,
            y = (this.mouse.y - offsetY) / tileScale + camera.gridY;

        return {
            x: x,
            y: y
        };
    }

    getTargetData(): TargetData | undefined {
        const frame = this.targetAnimation.currentFrame,
            superScale = this.renderer?.getSuperScaling() as number,
            sprite = this.game.getSprite('target');

        if (!sprite) return;

        if (!sprite.loaded) sprite.load();

        return (this.targetData = {
            sprite,
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

    updateFrozen(state: boolean): void {
        this.game.socket?.send(Packets.Movement, [Packets.MovementOpcode.Freeze, state]);
    }

    isTargetable(entity: Entity): boolean {
        return this.isAttackable(entity) || entity.type === 'npc' || entity.type === 'chest';
    }

    isAttackable(entity: Entity): boolean {
        return entity.type === 'mob' || (entity.type === 'player' && entity.pvp && this.game.pvp);
    }

    isSamePosition(position: Pos): boolean {
        const player = this.getPlayer();

        return position.x === player.gridX && position.y === player.gridY;
    }

    getPlayer(): Player {
        return this.game.player as Player;
    }

    getActions(): Actions {
        return this.game.menu?.actions as Actions;
    }
}
