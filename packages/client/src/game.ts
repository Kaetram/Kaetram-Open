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
import PlayerHandler from './entity/character/player/playerhandler';
import Map from './map/map';
import Connection from './network/connection';
import Socket from './network/socket';
import Utils from './utils/util';
import Camera from './renderer/camera';
import Minigame from './renderer/minigame';
import Overlays from './renderer/overlays';
import Renderer from './renderer/renderer';
import Updater from './renderer/updater';
import { agent } from './utils/detect';
import Pathfinder from './utils/pathfinder';

import { Packets } from '@kaetram/common/network';

import type App from './app';
import type Character from './entity/character/character';
import type Entity from './entity/entity';
import type Storage from './utils/storage';

export default class Game {
    public storage: Storage;

    public map: Map = new Map(this);
    public camera: Camera = new Camera(this.map.width, this.map.height, this.map.tileSize);

    public player: Player = new Player('');

    public zoning: Zoning = new Zoning();
    public overlays: Overlays = new Overlays();
    public pathfinder: Pathfinder = new Pathfinder();

    public info: InfoController = new InfoController();
    public sprites: SpritesController = new SpritesController();

    public minigame: Minigame = new Minigame();

    public renderer: Renderer;
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

    public constructor(public app: App) {
        this.storage = app.storage;

        this.renderer = new Renderer(this);
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

        new PlayerHandler(this, this.player);

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
        ignores: Character[] = []
    ): number[][] {
        let path: number[][] = [];

        if (this.map.isColliding(x, y) && !this.map.isObject(x, y)) return path;

        if (ignores) for (let entity of ignores) this.pathfinder.addIgnore(entity);

        path = this.pathfinder.find(this.map.grid, character.gridX, character.gridY, x, y);

        if (ignores) this.pathfinder.clearIgnores(this.map.grid);

        return path;
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

        /**
         * Create a slightly larger than a tile boundary around the entity and check
         * if the position is within that boundary. If it is, then we have found the
         * entity we are looking for.
         */

        for (let entity of entities) {
            let spriteStartX = entity.x - Utils.thirdTile,
                spriteStartY = entity.y - Utils.thirdTile,
                spriteEndX = entity.x + Utils.tileAndAQuarter,
                spriteEndY = entity.y + Utils.tileAndAQuarter;

            if (
                position.x >= spriteStartX &&
                position.x <= spriteEndX &&
                position.y >= spriteStartY &&
                position.y <= spriteEndY
            )
                return entity;
        }

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
