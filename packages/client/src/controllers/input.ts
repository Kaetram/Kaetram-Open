import Chat from './chat';
import HUDController from './hud';

import Animation from '../entity/animation';
import log from '../lib/log';
import { isMobile } from '../utils/detect';
import Character from '../entity/character/character';

import { Modules, Packets, Opcodes } from '@kaetram/common/network';

import type Interact from '../menu/interact';
import type Friends from '../menu/friends';
import type Inventory from '../menu/inventory';
import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import type Camera from '../renderer/camera';
import type App from '../app';
import type Map from '../map/map';
import type Trade from '../menu/trade';

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
    private map: Map;
    private camera: Camera;
    public player: Player;
    private friends: Friends;
    private interact: Interact;
    private inventory: Inventory;
    private trade: Trade;

    public selectedCellVisible = false;
    public keyMovement = false;
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
    public chatHandler: Chat;
    public hud: HUDController;

    public entity: Entity | undefined;
    public interactEntity: Entity | undefined; // Used to store entity while the interact menu is active.

    public constructor(private game: Game) {
        this.app = game.app;
        this.map = game.map;
        this.camera = game.camera;
        this.player = game.player;
        this.friends = game.menu.getFriends();
        this.inventory = game.menu.getInventory();
        this.interact = game.menu.getInteract();
        this.trade = game.menu.getTrade();

        this.chatHandler = new Chat(game);
        this.hud = new HUDController(this);

        this.app.onLeftClick(this.handleLeftClick.bind(this));
        this.app.onRightClick(this.handleRightClick.bind(this));

        this.app.onKeyDown(this.handleKeyDown.bind(this));
        this.app.onKeyUp(this.handleKeyUp.bind(this));

        //this.app.onKeyDown(this.handle.bind(this));
        this.app.onMouseMove((event: MouseEvent) => {
            if (!this.game.started) return;

            this.setCoords(event);
            this.moveCursor();
        });

        this.interact.onButton(this.handleInteract.bind(this));
        this.interact.onClose(() => (this.interactEntity = undefined));

        this.friends.onMessage((username: string) => this.chatHandler.privateMessage(username));

        this.targetAnimation.setSpeed(50);
    }

    /**
     * Loads all the cursors one by one and inputs
     * them in our dictionary of cursors.
     */

    public loadCursors(): void {
        this.cursors.hand = this.game.sprites.get('hand');
        this.cursors.sword = this.game.sprites.get('sword');
        this.cursors.loot = this.game.sprites.get('loot');
        this.cursors.target = this.game.sprites.get('target');
        this.cursors.arrow = this.game.sprites.get('arrow');
        this.cursors.talk = this.game.sprites.get('talk');
        this.cursors.spell = this.game.sprites.get('spell');
        this.cursors.bow = this.game.sprites.get('bow');
        this.cursors.axe = this.game.sprites.get('axe_cursor');
        this.cursors.pickaxe = this.game.sprites.get('pickaxe_cursor');

        log.debug('Loaded Cursors!');
    }

    /**
     * Handles the input coming from the left click of the mouse.
     * This is the equivalent to a tap on a mobile device.
     * @param event DOM event containing click data on the screen.
     */

    private handleLeftClick(event: MouseEvent): void {
        this.setCoords(event);

        this.keyMovement = false;
        this.player.disableAction = false;

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
     * @param position The position of the press.
     */

    private handleRightClick(pos: { x: number; y: number }): void {
        this.setCoords(pos);

        let position = this.getCoords(),
            entity = this.game.searchForEntityAt(position);

        // Ignore if no entity or the entity is the player.
        if (!entity || entity.instance === this.player.instance) return this.interact.hide();

        this.interact.show(this.mouse, entity, this.game.pvp);

        this.interactEntity = entity;
    }

    /**
     * Input handler for when a key goes down. Note that this only
     * gets toggled in the event that the key is pressed down, and until
     * the key is released (key up event) and pressed again, it won't call.
     * @param event The DOM event containing key information.
     */

    private handleKeyDown(event: KeyboardEvent): void {
        // Redirect input to the trade handler if the trade input is visible.
        if (this.trade.isInputDialogueVisible()) return this.trade.keyDown(event.key);

        // Redirect input to the inventory handler if the inventory is visible.
        if (this.inventory.isDropDialogVisible()) return this.inventory.keyDown(event.key);

        // Redirect input to the friends handler if the friends input is visible.
        if (this.friends.isPopupActive()) return this.friends.keyDown(event.key);

        // Redirect input to the chat handler if the chat input is visible.
        if (this.chatHandler.inputVisible()) return this.chatHandler.keyDown(event.key);

        let target: Entity;

        switch (event.key) {
            case 'w':
            case 'ц':
            case 'ArrowUp': {
                this.player.moveUp = true;
                return;
            }

            case 'a':
            case 'ф':
            case 'ArrowLeft': {
                this.player.moveLeft = true;
                return;
            }

            case 's':
            case 'ы':
            case 'ArrowDown': {
                this.player.moveDown = true;
                return;
            }

            case 'd':
            case 'в':
            case 'ArrowRight': {
                this.player.moveRight = true;
                return;
            }

            case 'Enter': {
                this.chatHandler.toggle();
                return;
            }

            case 'i': {
                this.game.menu.getInventory().toggle();
                return;
            }

            case 'm': {
                this.game.menu.getWarp().toggle();
                return;
            }

            case 'p': {
                this.game.menu.getProfile().toggle();
                return;
            }

            case 'h': {
                this.game.menu.getInventory().selectEdible();
                break;
            }

            case 't': {
                target = this.game.entities.get(this.player.lastTarget);

                if (!target) return;

                this.setAttackTarget();
                this.setPosition(target.gridX, target.gridY);

                this.player.follow(target);

                return;
            }

            case 'Escape': {
                this.game.menu.hide();

                if (this.player.moving) this.player.stop();
                return;
            }

            case '+':
            case '=': {
                return this.game.zoom(0.2);
            }

            case '-':
            case '_': {
                return this.game.zoom(-0.2);
            }

            case '0':
            case ')': {
                this.camera.setZoom();

                return this.game.zoom(0);
            }
        }
    }

    /**
     * Event handler for when the key is released. This function's
     * primary purpose is to stop movement when the key is released.
     * @param event DOM event data containing key information.
     */

    public handleKeyUp(event: KeyboardEvent): void {
        switch (event.key) {
            case 'w':
            case 'ArrowUp': {
                this.player.moveUp = false;
                break;
            }

            case 'a':
            case 'ArrowLeft': {
                this.player.moveLeft = false;
                break;
            }

            case 's':
            case 'ArrowDown': {
                this.player.moveDown = false;
                break;
            }

            case 'd':
            case 'ArrowRight': {
                this.player.moveRight = false;
                break;
            }
        }

        this.player.disableAction = false;
    }

    /**
     * Receives an interact menu action from the interact handler. We use the entity
     * in the input to determine the course of action.
     * @param menuAction Which button in the interact menu was pressed.
     */

    private handleInteract(menuAction: Modules.MenuActions): void {
        // No entity to interact with, perhaps this was called with the interact menu closed?
        if (!this.interactEntity) return;

        switch (menuAction) {
            case Modules.MenuActions.Attack: {
                return this.move({
                    x: this.interactEntity.x,
                    y: this.interactEntity.y,
                    gridX: this.interactEntity.gridX,
                    gridY: this.interactEntity.gridY
                });
            }

            case Modules.MenuActions.Trade: {
                this.game.player.trade(this.interactEntity);
                break;
            }

            case Modules.MenuActions.Follow: {
                if (this.interactEntity instanceof Character)
                    this.game.player.pursue(this.interactEntity);
                break;
            }

            case Modules.MenuActions.Examine: {
                this.game.socket.send(Packets.Examine, [this.interactEntity.instance]);
                break;
            }

            case Modules.MenuActions.AddFriend: {
                this.game.socket.send(Packets.Friends, {
                    opcode: Opcodes.Friends.Add,
                    username: this.interactEntity.name
                });
                break;
            }
        }

        this.interact.hide();
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

    public keyMove(position: Coordinate): void {
        if (this.player.hasPath()) return;

        this.keyMovement = true;

        this.move(position);
    }

    /**
     * Function responsible for the movement of the player. If we detect
     * an entity at the specific position (one that can be targeted or
     * attacked) we initiate a target action. Otherwise, we just move
     * the player to the new position and start the pathing.
     * @param position The grid coordinates of the position we're requesting.
     */

    private move(position: Coordinate, useSearch = !this.keyMovement): void {
        if (this.player.stunned || this.player.teleporting) return;

        // Default the target to the passive one.
        this.setPassiveTarget();

        // Prevent any input when actions are disabled or we are zoning.
        if (this.player.disableAction || this.game.zoning.direction) return;

        // Prevent input outside map boundaries.
        if (this.game.map.isOutOfBounds(position.gridX, position.gridY)) return;

        // If chat is open on mobile we automatically toggle it so it gets out of the way.
        if (isMobile() && this.chatHandler.inputVisible()) this.chatHandler.toggle();

        // Hides all game menus (profile, inventory, warps, etc.)
        this.game.menu.hide();

        // Handle object interaction.
        if (this.game.map.isObject(position.gridX, position.gridY))
            return this.player.setObjectTarget(position);

        // Remove player's targets prior to an action.
        this.player.removeTarget();

        // Handle NPC interaction.
        this.entity = useSearch
            ? this.game.searchForEntityAt(position)
            : this.game.getEntityAt(position.gridX, position.gridY);

        if (this.entity) {
            this.setAttackTarget();

            // Set target and follow a targetable entity.
            if (this.isTargetable(this.entity)) {
                this.player.follow(this.entity);

                if (this.isAttackable(this.entity))
                    (this.entity as Character).addAttacker(this.player);

                if (this.player.isRanged())
                    this.game.socket.send(Packets.Target, [
                        Opcodes.Target.Attack,
                        this.entity.instance
                    ]);
                return;
            }
        }

        // Move the player to the new position.
        this.player.go(position.gridX, position.gridY);
    }

    /**
     * Function every time the cursor moves on the webpage. We essentially
     * grab the cursor's grid position within the game and check if there
     * are any entities or objects at that location. We update the cursor
     * sprite depending on the type of entity or object.
     */

    public moveCursor(): void {
        if (isMobile()) return;

        let position = this.getCoords();

        // The entity we are currently hovering over.
        this.entity = this.game.searchForEntityAt(position);

        // Update the overlay with entity information.
        this.hud.update(this.entity);

        if (!this.entity) {
            /**
             * Because objects aren't exactly entities, we have a special
             * case for checking if the hovering coordinates are objects.
             */

            if (this.map.isObject(position.gridX, position.gridY)) {
                let cursor = this.map.getTileCursor(position.gridX, position.gridY);

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
            case Modules.EntityType.Chest: {
                this.setCursor(this.cursors.loot);
                this.hovering = Modules.Hovering.Item;
                break;
            }

            case Modules.EntityType.Mob: {
                this.setCursor(this.getAttackCursor());
                this.hovering = Modules.Hovering.Mob;
                break;
            }

            case Modules.EntityType.NPC: {
                this.setCursor(this.cursors.talk);
                this.hovering = Modules.Hovering.NPC;
                break;
            }

            case Modules.EntityType.Player: {
                if (this.game.pvp) {
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Player;
                }
                break;
            }
        }
    }

    /**
     * Saves the current mouse position into a position object
     * to prevent the mouse from rendering if it doesn't move.
     */

    public saveMouse(): void {
        this.lastMousePosition.x = this.mouse.x;
        this.lastMousePosition.y = this.mouse.y;
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

    public setCoords(position: { x: number; y: number }): void {
        let { width, height } = this.game.renderer.background;

        // Set the mouse position to the x and y coordinates within the event.
        this.mouse.x = position.x;
        this.mouse.y = position.y;

        // Add horizontal boundaries to the mouse.
        if (this.mouse.x >= width) this.mouse.x = width - 1;
        else if (this.mouse.x <= 0) this.mouse.x = 0;

        // Add vertical boundaries to the mouse.
        if (this.mouse.y >= height) this.mouse.y = height - 1;
        else if (this.mouse.y <= 0) this.mouse.y = 0;
    }

    /**
     * @returns If a player uses a ranged magic weapon we display the spell icon,
     * if they are using a ranged weapon we display the bow, otherwise a sword.
     */

    private getAttackCursor(): Sprite {
        if (this.player.isMagic()) return this.cursors.spell;
        if (this.player.isRanged()) return this.cursors.bow;

        return this.cursors.sword;
    }

    /**
     * Uses the mouse x and y position to calculate the exact grid
     * coordinate on the screen.
     * @returns A position object containing the grid coordinates.
     */

    public getCoords(): Coordinate {
        let offsetX = this.mouse.x % this.camera.zoomFactor,
            offsetY = this.mouse.y % this.camera.zoomFactor,
            x = (this.mouse.x - offsetX) / this.camera.zoomFactor + this.camera.x,
            y = (this.mouse.y - offsetY) / this.camera.zoomFactor + this.camera.y,
            gridX = Math.floor(x / this.map.tileSize),
            gridY = Math.floor(y / this.map.tileSize);

        return { x, y, gridX, gridY };
    }

    /**
     * Prepares the target data for the renderer to use.
     * Though this function would belong more-so in the
     * renderer, it is best to have it here since target
     * data is associated with input information.
     * @returns A TargetData object ready for the renderer.
     */

    public getTargetData(): TargetData | undefined {
        let sprite = this.game.sprites.get('target');

        if (!sprite) return;

        let { frame } = this.targetAnimation,
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
        return entity.isMob() || (entity.isPlayer() && this.game.pvp);
    }

    /**
     * Checks if the last mouse position equals to that of the
     * current mouse position. If it is not, then the mouse must
     * be rendered to update its position on the screen.
     * @returns Whether the current mouse position is the same
     * as the old mouse's position.
     */

    public isMouseRendered(): boolean {
        return (
            this.mouse.x === this.lastMousePosition.x && this.mouse.y === this.lastMousePosition.y
        );
    }
}
