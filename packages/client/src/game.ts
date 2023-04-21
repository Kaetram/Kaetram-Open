import AudioController from './controllers/audio';
import BubbleController from './controllers/bubble';
import EntitiesController from './controllers/entities';
import InfoController from './controllers/info';
import InputController from './controllers/input';
import MenuController from './controllers/menu';
import Pointer from './controllers/pointer';
import SpritesController from './controllers/sprites';
import Zoning from './controllers/zoning';
import Player from './entity/character/player/player';
import Handler from './entity/character/player/handler';
import Map from './map/map';
import Connection from './network/connection';
import Socket from './network/socket';
import Camera from './renderer/camera';
import Minigame from './renderer/minigame';
import Overlays from './renderer/overlays';
import WebGL from './renderer/webgl/webgl';
import Canvas from './renderer/canvas';
import Updater from './renderer/updater';
import Pathfinder from './utils/pathfinder';
import { agent } from './utils/detect';

import { Packets } from '@kaetram/common/network';

import type App from './app';
import type Entity from './entity/entity';
import type Storage from './utils/storage';
import type Character from './entity/character/character';
import type { TileIgnore } from './utils/pathfinder';

export default class Game {
    public player: Player;
    public storage: Storage;

    public map: Map;
    public camera: Camera;

    public zoning: Zoning = new Zoning();
    public overlays: Overlays = new Overlays();
    public pathfinder: Pathfinder = new Pathfinder();

    public info: InfoController = new InfoController();
    public sprites: SpritesController;

    public minigame: Minigame = new Minigame();

    public renderer: WebGL | Canvas;
    public input: InputController;

    public socket: Socket;
    public pointer: Pointer;
    public updater: Updater;
    public audio: AudioController;
    public entities: EntitiesController;
    public bubble: BubbleController;
    public menu: MenuController;

    public connection: Connection;

    public time = Date.now();
    public lastTime = Date.now();

    public started = false;
    public ready = false;
    public pvp = false;
    public useWebGl = false;

    public constructor(public app: App) {
        this.storage = app.storage;

        this.player = new Player('', this);

        this.map = new Map(this);
        this.camera = new Camera(this.map.width, this.map.height, this.map.tileSize);
        this.sprites = new SpritesController();

        this.renderer = this.useWebGl ? new WebGL(this) : new Canvas(this);
        this.menu = new MenuController(this);
        this.input = new InputController(this);
        this.socket = new Socket(this);
        this.pointer = new Pointer(this);
        this.updater = new Updater(this);
        this.audio = new AudioController(this);
        this.entities = new EntitiesController(this);
        this.bubble = new BubbleController(this);
        this.connection = new Connection(this);

        app.sendStatus('Loading game');

        this.map.onReady(() => app.ready());

        app.onLogin(this.socket.connect.bind(this.socket));
        app.onResize(this.resize.bind(this));
        app.onRespawn(this.respawn.bind(this));

        this.player.onSync(this.handlePlayerSync.bind(this));
    }

    /**
     * Starts the game by fading the main menu out
     * and beginning the game loop `tick()`.
     */

    public start(): void {
        if (this.started) return;

        this.started = true;

        this.tick();
    }

    /**
     * Tick is a recursive function that calls for as long as the
     * game is running. We use `requestAnimationFrame` to get the
     * browser to call us back at the next available opportunity.
     */

    private tick(): void {
        this.time = Date.now();

        this.renderer.render();
        this.updater.update();

        if (this.started) requestAnimationFrame(() => this.tick());
    }

    /**
     * This method is responsible for handling sudden
     * disconnects of a player whilst in the game, not
     * menu-based errors.
     */

    public handleDisconnection(): void {
        if (!this.app.isMenuHidden()) return;

        location.reload();
    }

    /**
     * Handles synchronization for the player client-sided.
     * This is called whenever the player undergoes a change
     * in experience, level, equipment, etc. Note that this
     * synchronization is different from the Sync packet
     * that is received in `connection.ts.` That packet
     * is synchronization of other player characters, this one
     * involves our current client's player character.
     */

    private handlePlayerSync(): void {
        this.menu.synchronize();

        // Update sprite
        this.player.setSprite(this.sprites.get(this.player.getSpriteName()));
    }

    /**
     * Call this after the player has been welcomed
     * by the server and the client received the connection.
     */
    public postLoad(): void {
        this.entities.addEntity(this.player);

        this.player.setSprite(this.sprites.get(this.player.getSpriteName()));
        this.player.idle();

        if (this.storage) {
            this.player.setOrientation(this.storage.data.player.orientation);
            this.camera.setZoom(this.storage.data.player.zoom);

            this.renderer.resize();
        }

        this.camera.centreOn(this.player);

        this.player.handler = new Handler(this.player);

        this.renderer.updateAnimatedTiles();

        this.socket.send(Packets.Ready, {
            regionsLoaded: this.map.regionsLoaded,
            userAgent: agent
        });

        if (this.storage.data.new) {
            this.storage.data.new = false;
            this.storage.save();
        }

        if (this.map.hasCachedDate()) this.app.fadeMenu();
    }

    /**
     * Determines a path from the character's current position to the
     * specified `x` and `y` grid coordinate parameters.
     * @param character The character we are finding the path for.
     * @param x The destination x grid coordinate.
     * @param y The destination y grid coordinate.
     * @param ignores The list of character objects that we are ignoring.
     * @returns A 2D array of grid coordinates that represent the path.
     */

    public findPath(
        character: Character,
        x: number,
        y: number,
        ignores: TileIgnore[] = [],
        cursor = ''
    ): number[][] {
        let path: number[][] = [];

        path = this.pathfinder.find(this.map.grid, character.gridX, character.gridY, x, y, ignores);

        // Stop if there is no path.
        if (path.length === 0) return path;

        // Special case for fishing where we remove the last path if it is colliding.
        if (cursor === 'fishing') {
            let last = path[path.length - 2];

            // Remove if there is a collision  at the last path only (to allow fishing from a distance).
            if (this.map.isColliding(last[0], last[1])) path.pop();
        }

        return path;
    }

    /**
     * Used for when the player has selected low power mode and we do not
     * actively centre the camera on the character. We check the boundaries
     * of the camera and if the character approaches them we move the camera
     * in the next quadrant.
     */

    public updateCameraBounds(): void {
        // We are not using non-centred camera, so skip.
        if (!this.zoning) return;

        // Difference between the player and the camera, indicates which boundary we are approaching.
        let x = this.player.gridX - this.camera.gridX,
            y = this.player.gridY - this.camera.gridY;

        // Left boundary
        if (x === 0) this.zoning.setLeft();
        // Right boundary
        else if (x === this.camera.gridWidth - 2) this.zoning.setRight();
        // Top boundary
        else if (y === 0) this.zoning.setUp();
        // Bottom boundary
        else if (y === this.camera.gridHeight - 2) this.zoning.setDown();

        // No zoning has occured, so stop here.
        if (this.zoning.direction === null) return;

        // Synchronize the camera and reset the zoning directions.
        this.camera.zone(this.zoning.getDirection());

        // Update the animated tiles.
        this.renderer.updateAnimatedTiles();

        // Reset the zoning directions.
        this.zoning.reset();
    }

    /**
     * Plays the reviving sound effect and removes the death class.
     * We send a packet to the server to signal for respawn.
     */

    public respawn(): void {
        this.audio.playSound('revive');
        this.app.body.classList.remove('death');

        this.socket.send(Packets.Respawn, []);
    }

    /**
     * Calls all the resize functions in the controllers
     * that require resizing.
     */

    public resize(): void {
        this.renderer.resize();

        this.pointer.resize();

        this.menu.resize();
    }

    /**
     * Determines an entity at a specific grid coordinate.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns The first entity in the list that is at the grid coordinate.
     */

    public getEntityAt(x: number, y: number): Entity | undefined {
        if (!this.entities) return;

        let entities = this.entities.grids.renderingGrid[y][x],
            keys = Object.keys(entities),
            index = keys.indexOf(this.player.instance);

        // Remove player instance from the keys of entities.
        if (index !== -1) keys.splice(index, 1);

        // Returns entity if there is a key, otherwise just undefined.
        return entities[keys[0]];
    }

    /**
     * Looks through the entity rendering grid within the specified radius to find
     * any entities that are within the boundaries of the position provided.
     * @param position The position we are checking around (usually the mouse position).
     * @param radius How many tiles away from the position we are checking.
     * @returns An entity if found, otherwise undefined.
     */

    public searchForEntityAt(position: Position, radius = 2): Entity | undefined {
        let entities = this.entities.grids.getEntitiesAround(
            position.gridX!,
            position.gridY!,
            radius
        );

        // Look through all the entities we found and determine which one is closest to the mouse.
        for (let entity of entities)
            if (
                position.x >= entity.x + entity.sprite.offsetX &&
                position.x <= entity.x + entity.sprite.offsetX + entity.sprite.width &&
                position.y >= entity.y + entity.sprite.offsetY &&
                position.y <= entity.y + entity.sprite.offsetY + entity.sprite.height
            )
                return entity;

        return undefined;
    }

    /**
     * Handles the teleportation for a player character.
     * If this player is our game client's player, then
     * we must clear some of the user interfaces and begin
     * preparing the renderer for the new location.
     * @param character The character we are teleporting.
     * @param gridX The x grid coordinate we are teleporting to.
     * @param gridY The y grid coordinate we are teleporting to.
     */

    public teleport(character: Character, gridX: number, gridY: number): void {
        this.entities.unregisterPosition(character);

        character.setGridPosition(gridX, gridY);

        this.entities.registerPosition(character);

        character.frozen = false;
        character.teleporting = false;

        if (character.instance === this.player.instance) {
            character.clearHealthBar();

            this.player.moving = false;
            this.player.disableAction = false;
            this.camera.centreOn(this.player);
            this.renderer.updateAnimatedTiles();
        }
    }

    /**
     * Zooms out the game and updates the camera.
     * @param amount Amount to zoom in or out by.
     */

    public zoom(amount: number): void {
        this.camera.zoom(amount);
        this.storage.setZoom(this.camera.zoomFactor);

        this.renderer.resize();
    }
}
