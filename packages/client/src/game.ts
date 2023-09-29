import AudioController from './controllers/audio';
import BubbleController from './controllers/bubble';
import EntitiesController from './controllers/entities';
import InfoController from './controllers/info';
import InputController from './controllers/input';
import MenuController from './controllers/menu';
import Pointer from './controllers/pointer';
import SpritesController from './controllers/sprites';
import Zoning from './controllers/zoning';
import JoystickController from './controllers/joystick';
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
import Utils from './utils/util';
import { agent, supportsWebGl } from './utils/detect';

import { Packets } from '@kaetram/common/network';

import type App from './app';
import type Entity from './entity/entity';
import type Storage from './utils/storage';
import type Character from './entity/character/character';
import type { TileIgnore } from './utils/pathfinder';
import type Resource from './entity/objects/resource/resource';

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
    public joystick: JoystickController;
    public menu: MenuController;

    public connection: Connection;

    public time = Date.now();
    public timeDiff = Date.now(); // Used for FPS calculation.
    public timeLast = Date.now();
    public targetFPS = 1000 / 50;

    public started = false;
    public ready = false;
    public pvp = false;
    public throttle = false;
    public useWebGl = false;

    public constructor(public app: App) {
        this.storage = app.storage;
        this.useWebGl = supportsWebGl() && this.storage.isWebGl();

        this.player = new Player('', this);

        this.map = new Map(this);
        this.camera = new Camera(this.map.width, this.map.height, this.map.tileSize);
        this.sprites = new SpritesController();

        this.renderer = this.useWebGl ? new WebGL(this) : new Canvas(this);
        this.joystick = new JoystickController(this);
        this.menu = new MenuController(this);
        this.input = new InputController(this);
        this.socket = new Socket(this);
        this.updater = new Updater(this);
        this.audio = new AudioController(this);
        this.entities = new EntitiesController(this);
        this.bubble = new BubbleController(this.renderer, this.entities);
        this.pointer = new Pointer(this.renderer, this.entities);
        this.connection = new Connection(this);

        this.map.onReady(() => {
            app.ready();

            // Initialize the renderer for WebGL.
            this.renderer.load();
        });

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
        if (this.started) requestAnimationFrame(() => this.tick());

        this.time = Date.now();

        // Only calculate throttling when we enable it.
        if (this.throttle) {
            this.timeDiff = this.time - this.timeLast;

            if (this.timeDiff < this.targetFPS) return;

            this.timeLast = this.time - (this.timeDiff % this.targetFPS);
        }

        this.updater.update();
        this.renderer.render();
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
            this.pointer.resize();
            this.bubble.resize();
        }

        this.camera.centreOn(this.player);

        this.player.handler = new Handler(this.player);

        this.socket.send(Packets.Ready, {
            regionsLoaded: this.map.regionsLoaded,
            userAgent: agent
        });

        if (this.storage.isNew()) this.menu.getWelcome().show();

        if (this.storage.data.new) {
            this.storage.data.new = false;
            this.storage.save();
        }

        if (this.map.hasCachedDate()) this.app.fadeMenu();

        this.menu.synchronize();

        this.forceRendering();
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
            let last = path.at(-2)!;

            // Remove if there is a collision  at the last path only (to allow fishing from a distance).
            if (this.map.isColliding(last[0], last[1])) path.pop();
        }

        return path;
    }

    /**
     * Finds the closest non-colliding tile around the character entity.
     * @param character The character we are finding the closest tile for.
     */

    public findAdjacentTile(character: Character): void {
        if (!this.map.isColliding(character.gridX + 1, character.gridY))
            character.go(character.gridX + 1, character.gridY);
        else if (!this.map.isColliding(character.gridX - 1, character.gridY))
            character.go(character.gridX - 1, character.gridY);
        else if (!this.map.isColliding(character.gridX, character.gridY + 1))
            character.go(character.gridX, character.gridY + 1);
        else if (!this.map.isColliding(character.gridX, character.gridY - 1))
            character.go(character.gridX, character.gridY - 1);
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
        this.bubble.resize();

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

    public searchForEntityAt(position: Position, radius = 3): Entity | undefined {
        let entities = this.entities.grids.getEntitiesAround(
                position.gridX!,
                position.gridY!,
                radius
            ),
            closest: Entity | undefined;

        /**
         * We iterate through every entity that we find near the mouse position. We
         * check if the entity can be interacted with, and then we do some magical
         * math to determine if the mouse position is within the entity's boundaries.
         * We take the entity's bounding box, find the centre of it, and then we
         * calculate the distance between the mouse position and the centre of the
         * bounding box. Think of it as a circle, actually, turn on debug mode so
         * you can see the entity bounding box better.
         */

        for (let entity of entities) {
            // Exclude unnecessary entities.
            if (entity.isProjectile() || entity.isPet() || this.isMainPlayer(entity.instance))
                continue;

            // Skip if the entity is a resource and is exhausted.
            if (entity.isResource() && (entity as Resource).exhausted) continue;

            // Get the bounding box, determine the centre, calculate distance between mouse and centre.
            let boundingBox = entity.getBoundingBox(),
                centreX = boundingBox.x + boundingBox.width / 2,
                centreY = boundingBox.y + boundingBox.height / 2,
                distance = Utils.distance(position.x, position.y, centreX, centreY),
                threshold =
                    (entity.sprite.width < entity.sprite.height
                        ? entity.sprite.width
                        : entity.sprite.height) / 2;

            // Skip if the distance is greater than the boundary.
            if (distance > threshold) continue;

            // Find the closest entity to the mouse position.
            if (!closest || distance < closest.distance) {
                closest = entity;
                closest.distance = distance;
            }
        }

        return closest;
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
        }

        this.forceRendering();
    }

    /**
     * Zooms out the game and updates the camera.
     * @param amount Amount to zoom in or out by.
     */

    public zoom(amount: number): void {
        this.camera.zoom(amount);
        this.storage.setZoom(this.camera.zoomFactor);
        this.pointer.resize();

        this.renderer.resize();
    }

    /**
     * Whether or not the game is in low power mode. This prevents the camera
     * from following the player and disables animated tiles.
     */

    public isLowPowerMode(): boolean {
        return !this.camera.isCentered() && !this.renderer.animateTiles;
    }

    /**
     * Function to consolidate all calls to check whether or not the current
     * entity we're dealing with is the main player.
     * @param instance The instance we want to check.
     * @returns Whether the main player's instance matches the instance provided.
     */

    public isMainPlayer(instance: string): boolean {
        return this.player.instance === instance;
    }

    /**
     * Forcibly makes the renderer render a couple frames to
     * ensure animated tiles are rendered.
     */

    public forceRendering(): void {
        // Forcibly render the game for a few frames to ensure animated tiles are rendered.
        let count = 0,
            interval = setInterval(() => {
                this.renderer.forceRendering = true;

                count++;

                if (count > 10) clearInterval(interval);
            }, 100);
    }
}
