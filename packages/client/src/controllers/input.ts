import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Animation from '../entity/animation';
import log from '../lib/log';
import Chat from './chat';
import Overlay from './overlay';

import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
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
    private app: App = this.game.app;
    private map: Map = this.game.map;
    private renderer: Renderer = this.game.renderer;
    public player: Player = this.game.player;

    public selectedCellVisible = false;
    public targetVisible = true;
    public selectedX = -1;
    public selectedY = -1;

    public cursor!: Sprite;

    public targetColour = 'rgba(255, 255, 255, 0.5)';

    private cursors: { [cursor: string]: Sprite } = {};
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
        this.load();

        this.app.onLeftClick(this.handleLeftClick.bind(this));
        this.app.onRightClick(this.handleRightClick.bind(this));

        this.app.onKeyDown(this.handleKeyDown.bind(this));
        this.app.onKeyUp(this.handleKeyUp.bind(this));

        //this.app.onKeyDown(this.handle.bind(this));
        this.app.onMouseMove((event: JQuery.MouseMoveEvent) => {
            if (!this.game.started) return;

            this.setCoords(event);
            this.moveCursor();
        });
    }

    /**
     * Sets the target animation speed and begins
     * loading the overlay system.
     */

    private load(): void {
        this.targetAnimation.setSpeed(50);

        this.overlay = new Overlay(this);
    }

    /**
     * Loads all the cursors one by one and inputs
     * them in our dictionary of cursors.
     */

    public loadCursors(): void {
        this.cursors.hand = this.game.getSprite('hand');
        this.cursors.sword = this.game.getSprite('sword');
        this.cursors.loot = this.game.getSprite('loot');
        this.cursors.target = this.game.getSprite('target');
        this.cursors.arrow = this.game.getSprite('arrow');
        this.cursors.talk = this.game.getSprite('talk');
        this.cursors.spell = this.game.getSprite('spell');
        this.cursors.bow = this.game.getSprite('bow');
        this.cursors.axe = this.game.getSprite('axe_cursor');

        log.debug('Loaded Cursors!');
    }

    /**
     * Handles the input coming from the left click of the mouse.
     * This is the equivalent to a tap on a mobile device.
     * @param event JQuery event containing click data on the screen.
     */

    private handleLeftClick(event: JQuery.ClickEvent): void {
        this.setCoords(event);

        this.game.player.disableAction = false;

        // Admin command for teleporting to a location.
        if (this.isCtrlKey())
            return this.game.socket.send(Packets.Command, [
                Opcodes.Command.CtrlClick,
                this.getCoords()
            ]);

        this.move(this.getCoords());
    }

    /**
     * A right click is called a ContextMenuEvent. Here we determine
     * the coordinates of the click, and use that to activate the
     * action menu at that location.
     * @param event JQuery event containing click position information.
     */

    private handleRightClick(event: JQuery.ContextMenuEvent): void {
        this.setCoords(event);

        let position = this.getCoords(),
            entity = this.game.getEntityAt(position.x, position.y);

        if (!entity) return;

        this.game.menu.actions.show();
    }

    /**
     * Input handler for when a key goes down. Note that this only
     * gets toggled in the event that the key is pressed down, and until
     * the key is released (key up event) and pressed again, it won't call.
     * @param event The JQuery event containing key information.
     */

    private handleKeyDown(event: JQuery.KeyDownEvent): void {
        if (this.chatHandler.inputVisible()) return this.chatHandler.keyDown(event.key);

        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                this.game.player.moveUp = true;
                return;

            case 'a':
            case 'ArrowLeft':
                this.game.player.moveLeft = true;
                return;

            case 's':
            case 'ArrowDown':
                this.game.player.moveDown = true;
                return;

            case 'd':
            case 'ArrowRight':
                this.game.player.moveRight = true;
                return;

            case 'Enter':
                this.chatHandler.toggle();
                return;

            case 'i':
                this.game.menu.inventory.open();
                return;

            case 'm':
                this.game.menu.warp.open();
                return;

            case 'p':
                this.game.menu.profile.open();
                return;

            case 'Escape':
                this.game.menu.hideAll();
                return;

            case 'Plus':
                this.game.camera.zoom(0.1);
                this.game.renderer.resize();
                return;

            case 'Minus':
                this.game.camera.zoom(-0.1);
                this.game.renderer.resize();
                return;
        }
    }

    /**
     * Event handler for when the key is released. This function's
     * primary purpose is to stop movement when the key is released.
     * @param event JQuery event data containing key information.
     */

    public handleKeyUp(event: JQuery.KeyUpEvent): void {
        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                this.game.player.moveUp = false;
                return;

            case 'a':
            case 'ArrowLeft':
                this.game.player.moveLeft = false;
                return;

            case 's':
            case 'ArrowDown':
                this.game.player.moveDown = false;
                return;

            case 'd':
            case 'ArrowRight':
                this.game.player.moveRight = false;
                return;
        }

        this.game.player.disableAction = false;
    }

    /**
     * Receives position data from the updater and attempts
     * to move the player to the specified grid coordinates.
     * We essentially pass the coordinates through the same
     * function responsible for targeting movement from a
     * left click. Note that although the position type is
     * that of `Position` the x and y values are actually
     * grid coordinates.
     * @param position Position object containing player's
     * requested grid coordinates.
     */

    public keyMove(position: Position): void {
        if (this.game.player.hasPath()) return;

        this.move(position);
    }

    /**
     * Function responsible for the movement of the player. If we detect
     * an entity at the specific position (one that can be targeted or
     * attacked) we initiate a target action. Otherwise, we just move
     * the player to the new position and start the pathing.
     * @param position The grid coordinates of the position we're requesting.
     */

    private move(position: Position): void {
        if (this.player.stunned) return;

        // Default the target to the passive one.
        this.setPassiveTarget();

        // Prevent any input when actions are disabled or we are zoning.
        if (this.player.disableAction || this.game.zoning.direction) return;

        // Prevent input outside map boundaries.
        if (this.game.map.isOutOfBounds(position.x, position.y)) return;

        // If chat is open on mobile we automatically toggle it so it gets out of the way.
        if (this.game.renderer.mobile && this.chatHandler.inputVisible()) this.chatHandler.toggle();

        // Hides all game menus (profile, inventory, warps, etc.)
        this.game.menu.hideAll();

        // Handle object interaction.
        if (this.game.map.isObject(position.x, position.y))
            return this.player.setObjectTarget(position);

        // Remove player's targets prior to an action.
        this.player.removeTarget();

        // Handle NPC interaction.
        this.entity = this.game.getEntityAt(position.x, position.y);

        if (this.entity) {
            this.setAttackTarget();

            // Set target and follow a targetable entity.
            if (this.isTargetable(this.entity)) {
                this.player.setTarget(this.entity);
                this.player.follow(this.entity);
            }

            // Request attack for target.
            if (this.isAttackable(this.entity)) {
                this.game.socket.send(Packets.Target, [
                    Opcodes.Target.Attack,
                    this.entity.instance
                ]);
                return;
            }
        }

        // Move the player to the new position.
        this.player.go(position.x, position.y);
    }

    /**
     * Function every time the cursor moves on the webpage. We essentially
     * grab the cursor's grid position within the game and check if there
     * are any entities or objects at that location. We update the cursor
     * sprite depending on the type of entity or object.
     */

    public moveCursor(): void {
        if (this.renderer.mobile) return;

        let position = this.getCoords();

        // The entity we are currently hovering over.
        this.entity = this.game.getEntityAt(position.x, position.y);

        // Update the overlay with entity information.
        this.overlay.update(this.entity);

        if (!this.entity) {
            /**
             * Because objects aren't exactly entities, we have a special
             * case for checking if the hovering coordinates are objects.
             */

            if (this.map.isObject(position.x, position.y)) {
                let cursor = this.map.getTileCursor(position.x, position.y);

                // Default to the talk if no cursor is specified for the object.
                this.setCursor(this.cursors[cursor || 'talk']);
                this.hovering = Modules.Hovering.Object;

                return;
            }

            // Default to hand cursor when no entities or objects are present.
            this.setCursor(this.cursors.hand);
            this.hovering = null;

            return;
        }

        switch (this.entity.type) {
            case Modules.EntityType.Item:
            case Modules.EntityType.Chest:
                this.setCursor(this.cursors.loot);
                this.hovering = Modules.Hovering.Item;
                break;

            case Modules.EntityType.Mob:
                this.setCursor(this.getAttackCursor());
                this.hovering = Modules.Hovering.Mob;
                break;

            case Modules.EntityType.NPC:
                this.setCursor(this.cursors.talk);
                this.hovering = Modules.Hovering.NPC;
                break;

            case Modules.EntityType.Player:
                if (this.entity.pvp && this.game.pvp) {
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Player;
                }
                break;
        }
    }

    /**
     * Sets the grid coordinate position of the
     * currently selected x and y coordinates.
     * @param x The grid x coordinate.
     * @param y The grid y coordinate.
     */

    public setPosition(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
    }

    /**
     * Updates the current cursor with the new cursor provided.
     * @param cursor Sprite of the cursor we are updating our current one with.
     */

    private setCursor(cursor: Sprite): void {
        if (cursor) this.cursor = cursor;
    }

    /**
     * Sets the animation for the target when requesting a
     * position to the green spinning square target sprite.
     */

    public setPassiveTarget(): void {
        this.targetAnimation.setRow(0);
    }

    /**
     * Sets the animation for the target to the red
     * spinning sprite indicating a target-based
     * movement is occurring.
     */

    private setAttackTarget(): void {
        this.targetAnimation.setRow(1);
    }

    /**
     * Updates the mouse's position using the `pageX` and `pageY`
     * properties contained within the event parameter. Function
     * also checks if the mouse somehow magically exits the boundaries
     * of the canvas and binds it to the edge.test
     * @param event The event object containing the mouse's position.
     */

    public setCoords(
        event: JQuery.MouseMoveEvent | JQuery.ClickEvent | JQuery.ContextMenuEvent
    ): void {
        let { width, height } = this.game.renderer.background;

        // Set the mouse position to the x and y coordinates within the event.
        this.mouse.x = event.pageX;
        this.mouse.y = event.pageY;

        // Add horizontal boundaries to the mouse.
        if (this.mouse.x >= width) this.mouse.x = width - 1;
        else if (this.mouse.x <= 0) this.mouse.x = 0;

        // Add vertical boundaries to the mouse.
        if (this.mouse.y >= height) this.mouse.y = height - 1;
        else if (this.mouse.y <= 0) this.mouse.y = 0;
    }

    /**
     * @returns A bow sprite if the player is ranged, otherwise a sword
     * when targeting an entity.
     */

    private getAttackCursor(): Sprite {
        return this.cursors[this.player.isRanged() ? 'bow' : 'sword'];
    }

    /**
     * Uses the mouse x and y position to calculate the exact grid
     * coordinate on the screen.
     * @returns A position object containing the grid coordinates.
     */

    public getCoords(): Position {
        let tileScale = this.game.renderer.tileSize * this.game.renderer.zoomFactor,
            offsetX = this.mouse.x % tileScale,
            offsetY = this.mouse.y % tileScale,
            x = (this.mouse.x - offsetX) / tileScale + this.game.camera.gridX,
            y = (this.mouse.y - offsetY) / tileScale + this.game.camera.gridY;

        return { x, y };
    }

    /**
     * Prepares the target data for the renderer to use.
     * Though this function would belong more-so in the
     * renderer, it is best to have it here since target
     * data is associated with input information.
     * @returns A TargetData object ready for the renderer.
     */

    public getTargetData(): TargetData | undefined {
        let sprite = this.game.getSprite('target');

        if (!sprite) return;

        let frame = this.targetAnimation.currentFrame,
            { tileSize } = this.game.map,
            { zoomFactor } = this.game.camera;

        // Load the sprite if it isn't loaded.
        if (!sprite.loaded) sprite.load();

        return {
            sprite,
            x: frame.x,
            y: frame.y,
            width: sprite.width,
            height: sprite.height,
            dx: this.selectedX * tileSize * zoomFactor,
            dy: this.selectedY * tileSize * zoomFactor,
            dw: sprite.width * zoomFactor,
            dh: sprite.height * zoomFactor
        };
    }

    /**
     * Checks if the CTRL key is currently being held down. This
     * is generally used for administrators to teleport.
     * @returns Whether the CTRL key is active in the window.
     */

    private isCtrlKey(): boolean {
        return (window.event as MouseEvent).ctrlKey;
    }

    /**
     * Targetable entities are those that can be attacked, NPCs, and chests.
     * @param entity The entity we're comparing.
     */

    private isTargetable(entity: Entity): boolean {
        return this.isAttackable(entity) || entity.isNPC() || entity.isChest();
    }

    /**
     * An attackable entity is either a mob or a player in a PVP area.
     * @param entity The entity we are checking.
     */

    private isAttackable(entity: Entity): boolean {
        return entity.isMob() || (entity.isPlayer() && entity.pvp && this.game.pvp);
    }
}
