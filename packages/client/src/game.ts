import $ from 'jquery';
import _ from 'lodash';

import App from './app';
import AudioController from './controllers/audio';
import BubbleController from './controllers/bubble';
import EntitiesController from './controllers/entities';
import InfoController from './controllers/info';
import InputController from './controllers/input';
import MenuController from './controllers/menu';
import SpritesController from './controllers/sprites';
import Pointer from './controllers/pointer';
import Zoning from './controllers/zoning';
import Character from './entity/character/character';
import Player from './entity/character/player/player';
import PlayerHandler from './entity/character/player/playerhandler';
import Entity from './entity/entity';
import Map from './map/map';
import Connection from './network/connection';
import Socket from './network/socket';
import Camera from './renderer/camera';
import Overlay from './renderer/overlay';
import Renderer from './renderer/renderer';
import Updater from './renderer/updater';
import Pathfinder from './utils/pathfinder';
import Storage from './utils/storage';

import { agent } from './utils/detect';
import { Modules, Packets } from '@kaetram/common/network';

import type { APIData } from '@kaetram/common/types/api';

export default class Game {
    public player: Player = new Player('');

    public zoning: Zoning = new Zoning();
    public storage: Storage = new Storage();
    public overlays: Overlay = new Overlay();

    public sprites: SpritesController = new SpritesController();

    public map: Map = new Map(this);
    public camera: Camera = new Camera(this.map.width, this.map.height, this.map.tileSize);
    public renderer: Renderer = new Renderer(this);
    public input: InputController = new InputController(this);

    public socket: Socket = new Socket(this);
    public pointer: Pointer = new Pointer(this);
    public updater: Updater = new Updater(this);
    public pathfinder: Pathfinder = new Pathfinder();
    public info: InfoController = new InfoController();
    public audio: AudioController = new AudioController(this);
    public entities: EntitiesController = new EntitiesController(this);
    public bubble: BubbleController = new BubbleController(this);
    public menu: MenuController = new MenuController(this);

    public started = false;
    public ready = false;

    public time = Date.now();
    public lastTime = Date.now();

    public pvp = false;

    public world!: APIData;

    public constructor(public app: App) {
        this.map.onReady(this.handleMap.bind(this));

        this.app.onLogin(this.connect.bind(this));
        this.app.onResize(this.resize.bind(this));
        this.app.onRespawn(this.respawn.bind(this));

        this.loadControllers();
    }

    /**
     * Starts the game by fading the main menu out
     * and beginning the game loop `tick()`.
     */

    public start(): void {
        if (this.started) return;

        this.started = true;

        this.app.fadeMenu();
        this.tick();
    }

    /**
     * Setting `started` to false will stop the game loop `tick()`.
     */

    private stop(): void {
        this.started = false;
        this.ready = false;
    }

    /**
     * Tick is a recursive function that calls for as long as the
     * game is running. We use `requestAnimationFrame` to get the
     * browser to call us back at the next available opportunity.
     */

    private tick(): void {
        if (!this.ready) return;

        this.time = Date.now();

        this.renderer.render();
        this.updater.update();

        if (this.started) requestAnimationFrame(() => this.tick());
    }

    /**
     * Sets all controllers back to their null state when we begin
     * logging out of a game session. We try to start a new fresh
     * session from the main menu without refreshing the page.
     */

    private unload(): void {
        // TODO - Refactor after cleaning up game some more.
        this.socket = null!;
        this.renderer = null!;
        this.updater = null!;
        this.storage = null!;
        this.entities = null!;
        this.input = null!;
        this.map = null!;
        this.player = null!;
        this.pathfinder = null!;
        this.zoning = null!;
        this.info = null!;
        this.menu = null!;

        this.audio.stop();
        this.audio = null!;
    }

    /**
     * Callback handler for when the map has finished loading. We use the map
     * and assign it to the renderer.
     */

    private handleMap(): void {
        this.app.sendStatus('Initializing updater');

        this.app.ready();
    }

    /**
     */

    private loadControllers(): void {
        this.app.sendStatus('Loading local storage');

        if (window.config.worldSwitch)
            $.get(`${window.config.hub}/all`, (servers) => this.loadWorlds(servers));

        this.loadStorage();
    }

    private loadWorlds(servers: APIData[]): void {
        let { storage } = this;

        for (let [i, server] of servers.entries()) {
            let row = $(document.createElement('tr'));

            row.addClass('server-list');
            row.append($(document.createElement('td')).text(server.serverId));
            row.append(
                $(document.createElement('td')).text(`${server.playerCount}/${server.maxPlayers}`)
            );

            $('#worlds-list').append(row);

            let setServer = () => {
                this.world = server;

                storage.data.world = server.serverId;
                storage.save();

                $('.server-list').removeClass('active');
                row.addClass('active');

                $('#current-world-index').text(i);

                $('#current-world-id').text(server.serverId);
                $('#current-world-count').text(`${server.playerCount}/${server.maxPlayers}`);

                $('#worlds-switch').on('click', () => $('#worlds-popup').toggle());
            };

            row.on('click', setServer);

            if (server.serverId === storage.data.world) setServer();
        }
    }

    public connect(): void {
        this.socket.connect();

        // this.connectionHandler =
        new Connection(this);
    }

    /**
     * Call this after the player has been welcomed
     * by the server and the client received the connection.
     */
    public postLoad(): void {
        this.renderer.loadStaticSprites();

        this.entities.addEntity(this.player);

        let defaultSprite = this.sprites.get(this.player.getSpriteName());
        this.player.setSprite(defaultSprite);

        if (this.storage) this.player.setOrientation(this.storage.data.player.orientation);

        this.player.idle();

        this.camera.centreOn(this.player);

        if (this.map)
            this.socket.send(Packets.Ready, {
                hasMapData: this.map.preloadedData,
                userAgent: agent
            });

        new PlayerHandler(this, this.player);

        this.renderer.updateAnimatedTiles();

        this.updater.setSprites(this.entities.sprites);

        if (this.storage.data.new) {
            this.storage.data.new = false;
            this.storage.save();
        }
    }

    private loadStorage(): void {
        let loginName = $('#login-name-input'),
            loginPassword = $('#login-password-input');

        loginName.prop('readonly', false);
        loginPassword.prop('readonly', false);

        if (!this.storage.hasRemember()) return;

        if (this.storage.getUsername() !== '') loginName.val(this.storage.getUsername());

        if (this.storage.getPassword() !== '') loginPassword.val(this.storage.getPassword());

        $('#remember-me').prop('checked', true);
    }

    /**
     * Determines a path from the character's current position to the
     * specified `x` and `y` grid coordinate parameters.
     * @param character The character we are finding the path for.
     * @param x The destination x grid coordinate.
     * @param y The destination y grid coordinate.
     * @param ignores The list of character objects that we are ignoring.
     * @param isObject Whether or not we are finding path to an object.
     * @returns A 2D array of grid coordinates that represent the path.
     */

    public findPath(
        character: Character,
        x: number,
        y: number,
        ignores: Character[] = [],
        isObject = false
    ): number[][] {
        let { map, pathfinder } = this,
            path: number[][] = [];

        if (!pathfinder || (map.isColliding(x, y) && !map.isObject(x, y))) return path;

        if (ignores) _.each(ignores, (entity) => pathfinder.addIgnore(entity));

        path = pathfinder.find(map.grid, character.gridX, character.gridY, x, y);

        if (ignores) pathfinder.clearIgnores(map.grid);

        if (isObject) path.pop(); // Remove the last path index

        return path;
    }

    /**
     * This method is responsible for handling sudden
     * disconnects of a player whilst in the game, not
     * menu-based errors.
     */
    public handleDisconnection(noError = false): void {
        let { started, renderer, menu, app } = this;

        if (!started) return;

        this.stop();

        renderer.stop();
        menu.stop();

        this.unload();

        app.showMenu();

        if (noError) {
            app.sendError(null, 'You have been disconnected from the server');
            app.statusMessage = null;
        }

        this.loadControllers();

        app.toggleLogin(false);
        app.updateLoader('');
    }

    public respawn(): void {
        let { audio, app, socket } = this;

        console.log('yo???');

        audio.play(Modules.AudioTypes.SFX, 'revive');
        app.body.removeClass('death');

        socket.send(Packets.Respawn, []);
    }

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
            keys = _.keys(entities),
            index = keys.indexOf(this.player.instance);

        // Remove player instance from the keys of entities.
        if (index !== -1) keys.splice(index, 1);

        // Returns entity if there is a key, otherwise just undefined.
        return entities[keys[0]];
    }
}
