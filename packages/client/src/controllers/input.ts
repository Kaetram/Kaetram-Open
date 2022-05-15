import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Animation from '../entity/animation';
import log from '../lib/log';
import Chat from './chat';
import Overlay from './overlay';

import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import type Actions from '../menu/actions';
import type App from '../app';
import type Renderer from '../renderer/renderer';
import type Map from '../map/map';

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
    private app: App;
    private renderer: Renderer;
    private map: Map;

    public selectedCellVisible = false;
    private cursorVisible = true;
    public targetVisible = true;
    public selectedX = -1;
    public selectedY = -1;

    public cursor!: Sprite;
    private newCursor!: Sprite;

    public targetColour!: string;
    private newTargetColour!: string;

    public keyMovement = true;
    public cursorMoved = false;

    private cursors: { [cursor: string]: Sprite | undefined } = {};
    public lastMousePosition: Position = { x: 0, y: 0 };

    public hovering!: Modules.Hovering | null;

    public mouse: Position = { x: 0, y: 0 };

    /**
     * This is the animation for the target
     * cell spinner sprite (only on desktop)
     */
    public targetAnimation: Animation = new Animation('move', 4, 0, 16, 16);
    public chatHandler: Chat = new Chat(this.game);
    public overlay!: Overlay;
    public entity: Entity | undefined;

    public constructor(private game: Game) {
        this.app = game.app;
        this.renderer = game.renderer;
        this.map = game.map;

        this.load();
    }

    private load(): void {
        this.targetAnimation.setSpeed(50);

        this.overlay = new Overlay(this);
    }

    public loadCursors(): void {
        let { cursors, game } = this;

        cursors.hand = game.getSprite('hand');
        cursors.sword = game.getSprite('sword');
        cursors.loot = game.getSprite('loot');
        cursors.target = game.getSprite('target');
        cursors.arrow = game.getSprite('arrow');
        cursors.talk = game.getSprite('talk');
        cursors.spell = game.getSprite('spell');
        cursors.bow = game.getSprite('bow');
        cursors.axe = game.getSprite('axe_cursor');

        this.newCursor = cursors.hand!;
        this.newTargetColour = 'rgba(255, 255, 255, 0.5)';

        log.debug('Loaded Cursors!');
    }

    public handle(inputType: Modules.InputType, data: Modules.Keys | JQuery.Event): void {
        let { chatHandler, game, renderer } = this,
            { menu, socket } = game,
            player = this.getPlayer();

        switch (inputType) {
            case Modules.InputType.Key:
                if (chatHandler.inputVisible()) {
                    chatHandler.key(data as Modules.Keys);
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

                    case Modules.Keys.Enter:
                        chatHandler.toggle();

                        break;

                    case Modules.Keys.I:
                        menu.inventory?.open();

                        break;

                    case Modules.Keys.M:
                        menu.warp?.open();

                        break;

                    case Modules.Keys.P:
                        menu.profile?.open();

                        break;

                    case Modules.Keys.Esc:
                        menu.hideAll();
                        break;

                    case Modules.Keys.Plus:
                        renderer.zoom(0.1);
                        break;

                    case Modules.Keys.Minus:
                        renderer.zoom(-0.1);
                        break;
                }

                break;

            case Modules.InputType.LeftClick:
                player.disableAction = false;
                this.keyMovement = false;
                this.setCoords(data as JQuery.MouseMoveEvent);

                if ((window.event as MouseEvent).ctrlKey) {
                    log.info('Control key is pressed lmao');

                    socket.send(Packets.Command, [Opcodes.Command.CtrlClick, this.getCoords()]);
                    return;
                }

                this.leftClick(this.getCoords());

                break;

            case Modules.InputType.RightClick:
                this.rightClick(this.getCoords());

                break;
        }
    }

    public keyUp(key: Modules.Keys): void {
        let player = this.getPlayer();

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

    public keyMove(position: Position): void {
        let player = this.getPlayer();

        if (!player.hasPath()) {
            this.keyMovement = true;
            this.cursorMoved = false;

            log.debug('--- keyMove ---');
            log.debug(position);
            log.debug('---------------');

            this.leftClick(position, true);
        }
    }

    private leftClick(position: Position | undefined, keyMovement = false): void {
        let { renderer, chatHandler, map, game } = this,
            player = this.getPlayer();

        if (player.stunned || !position) return;

        this.setPassiveTarget();

        /**
         * It can be really annoying having the chat open
         * on mobile, and it is far harder to control.
         */

        if (renderer.mobile && chatHandler.inputVisible()) chatHandler.toggle();

        if (map.isOutOfBounds(position.x, position.y)) return;

        if (game.zoning.direction || player.disableAction) return;

        game.menu.hideAll();

        if (map.isObject(position.x, position.y)) {
            player.setObjectTarget(position.x, position.y);
            player.followPosition(position.x, position.y);

            return;
        }

        if (renderer.mobile || keyMovement)
            this.entity = game.getEntityAt(
                position.x,
                position.y,
                position.x === player.gridX && position.y === player.gridY
            );

        let { entity } = this;

        if (entity) {
            player.disableAction = true;

            this.setAttackTarget();

            if (this.isTargetable(entity)) player.setTarget(entity);

            if (player.getDistance(entity) < 7 && player.isRanged() && this.isAttackable(entity)) {
                game.socket.send(Packets.Target, [Opcodes.Target.Attack, entity.instance]);
                player.lookAt(entity);
                return;
            }

            game.socket.send(Packets.Target, [Opcodes.Target.Attack, entity.instance]);

            if (this.isTargetable(entity)) {
                player.follow(entity);
                return;
            }
        }

        player.removeTarget();
        player.go(position.x, position.y);
    }

    private rightClick(position: Position | undefined): void {
        if (!position) return;

        let { renderer, game, mouse, hovering } = this;

        if (renderer.mobile)
            this.entity = game.getEntityAt(position.x, position.y, this.isSamePosition(position));

        let { entity } = this;

        if (entity) {
            let actions = this.getActions();

            // actions.loadDefaults(entity.type, {
            //     mouseX: mouse.x,
            //     mouseY: mouse.y,
            //     pvp: entity.pvp
            // });

            actions.show();
        } else if (hovering === Modules.Hovering.Object) {
            // TODO
        }
    }

    public updateCursor(): void {
        let { cursorVisible, newCursor, cursor, newTargetColour, targetColour } = this;

        if (!cursorVisible) return;

        if (newCursor !== cursor) this.cursor = newCursor;

        if (newTargetColour !== targetColour) this.targetColour = newTargetColour;
    }

    public moveCursor(): void {
        let { renderer, game, overlay, entity, map, cursors } = this;

        if (!renderer || renderer.mobile || !renderer.camera) return;

        let position = this.getCoords(),
            player = this.getPlayer();

        if (!position) return;

        // The entity we are currently hovering over.
        this.entity = game.getEntityAt(position.x, position.y, this.isSamePosition(position));

        overlay.update(entity);

        if (!entity || entity.instance === player.instance)
            if (map.isObject(position.x, position.y)) {
                let cursor = map.getTileCursor(position.x, position.y);

                this.setCursor(cursors[cursor || 'talk']);
                this.hovering = Modules.Hovering.Object;
            } else {
                this.setCursor(cursors.hand);
                this.hovering = null;
            }
        else
            switch (entity.type) {
                case Modules.EntityType.Item:
                case Modules.EntityType.Chest:
                    this.setCursor(cursors.loot);
                    this.hovering = Modules.Hovering.Item;
                    break;

                case Modules.EntityType.Mob:
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Mob;
                    break;

                case Modules.EntityType.NPC:
                    this.setCursor(cursors.talk);
                    this.hovering = Modules.Hovering.NPC;
                    break;

                case Modules.EntityType.Player:
                    if (entity.pvp && game.pvp) {
                        this.setCursor(this.getAttackCursor());
                        this.hovering = Modules.Hovering.Player;
                    }

                    break;
            }
    }

    public setPosition(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
    }

    public setCoords(event: JQuery.MouseMoveEvent<Document>): void {
        let { app, renderer, mouse } = this,
            offset = app.canvas.offset()!,
            { width, height } = renderer.background;

        this.cursorMoved = false;

        mouse.x = Math.round(event.pageX - offset.left);
        mouse.y = Math.round(event.pageY - offset.top);

        if (mouse.x >= width) mouse.x = width - 1;
        else if (mouse.x <= 0) mouse.x = 0;

        if (mouse.y >= height) mouse.y = height - 1;
        else if (mouse.y <= 0) mouse.y = 0;
    }

    private setCursor(cursor: Sprite | undefined): void {
        if (cursor) this.newCursor = cursor;
        else log.error(`Cursor: ${cursor} could not be found.`);
    }

    private setAttackTarget(): void {
        this.targetAnimation.setRow(1);
    }

    public setPassiveTarget(): void {
        this.targetAnimation.setRow(0);
    }

    private getAttackCursor(): Sprite | undefined {
        return this.cursors[this.getPlayer().isRanged() ? 'bow' : 'sword'];
    }

    public getCoords(): Position | undefined {
        let { renderer, mouse, game } = this;

        if (!renderer.camera) return;

        let tileScale = renderer.tileSize * renderer.zoomFactor,
            offsetX = mouse.x % tileScale,
            offsetY = mouse.y % tileScale,
            camera = game.getCamera(),
            x = (mouse.x - offsetX) / tileScale + camera.gridX,
            y = (mouse.y - offsetY) / tileScale + camera.gridY;

        return { x, y };
    }

    public getTargetData(): TargetData | undefined {
        let { targetAnimation, game, selectedX, selectedY, renderer } = this,
            sprite = game.getSprite('target');

        if (!sprite) return;

        let frame = targetAnimation.currentFrame,
            { tileSize, zoomFactor } = renderer;

        if (!sprite.loaded) sprite.load();

        return {
            sprite,
            x: frame.x,
            y: frame.y,
            width: sprite.width,
            height: sprite.height,
            dx: selectedX * tileSize * zoomFactor,
            dy: selectedY * tileSize * zoomFactor,
            dw: sprite.width * zoomFactor,
            dh: sprite.height * zoomFactor
        };
    }

    private updateFrozen(state: boolean): void {
        this.game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Freeze,
            frozen: state
        });
    }

    private isTargetable(entity: Entity): boolean {
        return this.isAttackable(entity) || entity.isNPC() || entity.isChest();
    }

    private isAttackable(entity: Entity): boolean {
        return entity.isMob() || (entity.isPlayer() && entity.pvp && this.game.pvp);
    }

    private isSamePosition(position: Position): boolean {
        let player = this.getPlayer();

        return position.x === player.gridX && position.y === player.gridY;
    }

    public getPlayer(): Player {
        return this.game.player;
    }

    private getActions(): Actions {
        return this.game.menu.actions;
    }
}
