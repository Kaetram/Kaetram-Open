import Renderer from './renderer/renderer';
import Storage from './utils/storage';
import Map from './map/map';
import Socket from './network/socket';
import Player from './entity/character/player/player';
import Updater from './renderer/updater';
import Entities from './controllers/entities';
import Input from './controllers/input';
import PlayerHandler from './entity/character/player/playerhandler';
import Pathfinder from './utils/pathfinder';
import Zoning from './controllers/zoning';
import Info from './controllers/info';
import Bubble from './controllers/bubble';
import Menu from './controllers/menu';
import Audio from './controllers/audio';
import Pointer from './controllers/pointer';
import Overlay from './renderer/overlay';
import Connection from './network/connection';
import _ from 'lodash';
import $ from 'jquery';
import * as Detect from './utils/detect';
import Packets from './network/packets';
import Modules from './utils/modules';
import App from './app';
import Messages from './network/messages';
import EntitiesController from './controllers/entities';
import Sprite from './entity/sprite';
import InputController from './controllers/input';
import InfoController from './controllers/info';
import MenuController from './controllers/menu';
import AudioController from './controllers/audio';
// import Pointer from './renderer/pointers/pointer';
import BubbleController from './controllers/bubble';
import Camera from './renderer/camera';
import Entity from './entity/entity';
import Character from './entity/character/character';
import Inventory from './menu/inventory';

export default class Game {
    app: App;
    id: number;
    socket: Socket;
    messages: Messages;
    renderer: Renderer;
    updater: Updater;
    storage: Storage;
    entities: EntitiesController;
    input: InputController;
    map: Map;
    playerHandler: PlayerHandler;
    pathfinder: Pathfinder;
    zoning: Zoning;
    info: InfoController;
    menu: MenuController;
    audio: AudioController;
    player: Player;
    stopped: boolean;
    started: boolean;
    ready: boolean;
    loaded: boolean;
    time: number;
    pvp: boolean;
    population: number;
    lastTime: number;
    overlays: Overlay;
    connectionHandler: Connection;
    pointer: Pointer;
    bubble: BubbleController;
    camera: Camera;
    inventory: Inventory;
    development: any;
    constructor(app: App) {
        this.app = app;

        this.id = -1;

        this.socket = null;
        this.messages = null;
        this.renderer = null;
        this.updater = null;
        this.storage = null;
        this.entities = null;
        this.input = null;
        this.map = null;
        this.playerHandler = null;
        this.pathfinder = null;
        this.zoning = null;
        this.info = null;
        this.menu = null;
        this.audio = null;

        this.player = null;

        this.stopped = false;
        this.started = false;
        this.ready = false;
        this.loaded = false;

        this.time = new Date().getTime();

        this.pvp = false;
        this.population = -1;

        this.lastTime = new Date().getTime();

        this.loadRenderer();
        this.loadControllers();
    }

    start(): void {
        if (this.started) return;

        this.app.fadeMenu();
        this.tick();

        this.started = true;
    }

    stop(): void {
        this.stopped = false;
        this.started = false;
        this.ready = false;
    }

    tick(): void {
        if (this.ready) {
            this.time = new Date().getTime();

            this.renderer.render();
            this.updater.update();

            if (!this.stopped) requestAnimationFrame(this.tick.bind(this));
        }
    }

    unload(): void {
        this.socket = null;
        this.messages = null;
        this.renderer = null;
        this.updater = null;
        this.storage = null;
        this.entities = null;
        this.input = null;
        this.map = null;
        this.playerHandler = null;
        this.player = null;
        this.pathfinder = null;
        this.zoning = null;
        this.info = null;
        this.menu = null;

        this.audio.stop();
        this.audio = null;
    }

    loadRenderer(): void {
        const background = document.getElementById('background') as HTMLCanvasElement,
            foreground = document.getElementById('foreground') as HTMLCanvasElement,
            overlay = document.getElementById('overlay') as HTMLCanvasElement,
            textCanvas = document.getElementById('textCanvas') as HTMLCanvasElement,
            entities = document.getElementById('entities') as HTMLCanvasElement,
            cursor = document.getElementById('cursor') as HTMLCanvasElement;

        this.app.sendStatus('Initializing render engine');

        this.setRenderer(
            new Renderer(background, entities, foreground, overlay, textCanvas, cursor, this)
        );
    }

    loadControllers(): void {
        const hasWorker = this.app.hasWorker();

        this.app.sendStatus('Loading local storage');

        this.setStorage(new Storage(this.app));

        this.app.sendStatus(hasWorker ? 'Loading maps - asynchronous' : null);

        if (hasWorker) this.loadMap();

        this.app.sendStatus('Initializing network socket');

        this.setSocket(new Socket(this));
        this.setMessages(this.socket.messages);
        this.setInput(new Input(this));

        this.app.sendStatus('Loading controllers');

        this.setEntityController(new Entities(this));

        this.setInfo(new Info(this));

        this.setBubble(new Bubble(this));

        this.setPointer(new Pointer(this));

        this.setAudio(new Audio(this));

        this.setMenu(new Menu(this));

        this.loadStorage();

        if (!hasWorker) {
            this.app.sendStatus(null);
            this.loaded = true;
        }
    }

    loadMap(): void {
        this.map = new Map(this);
        this.overlays = new Overlay(this);

        this.map.onReady(() => {
            if (!this.isDebug()) this.map.loadRegionData();

            this.app.sendStatus('Loading the pathfinder');

            this.setPathfinder(new Pathfinder(this.map.width, this.map.height));

            this.renderer.setMap(this.map);
            this.renderer.loadCamera();

            this.app.sendStatus('Loading updater');

            this.setUpdater(new Updater(this));

            this.entities.load();

            this.renderer.setEntities(this.entities);

            this.app.sendStatus(null);

            if (Detect.supportsWebGL())
                this.map.loadWebGL(this.renderer.backContext as WebGLRenderingContext);

            this.loaded = true;
        });
    }

    connect(): void {
        this.app.cleanErrors();

        setTimeout(() => {
            this.socket.connect();
        }, 1000);

        this.connectionHandler = new Connection(this);
    }

    postLoad(): void {
        /**
         * Call this after the player has been welcomed
         * by the server and the client received the connection.
         */

        this.renderer.loadStaticSprites();

        this.getCamera().setPlayer(this.player);

        this.entities.addEntity(this.player);

        const defaultSprite = this.getSprite(this.player.getSpriteName());

        this.player.setSprite(defaultSprite);
        this.player.setOrientation(this.storage.data.player.orientation);
        this.player.idle();

        this.socket.send(Packets.Ready, [true, this.map.preloadedData, Detect.getUserAgent()]);
        this.sendClientData();

        this.playerHandler = new PlayerHandler(this, this.player);

        this.renderer.updateAnimatedTiles();

        this.zoning = new Zoning(this);

        this.updater.setSprites(this.entities.sprites);

        this.renderer.verifyCentration();

        if (this.storage.data.new) {
            this.storage.data.new = false;
            this.storage.save();
        }
    }

    loadStorage(): void {
        const loginName = $('#loginNameInput'),
            loginPassword = $('#loginPasswordInput');

        loginName.prop('readonly', false);
        loginPassword.prop('readonly', false);

        if (!this.hasRemember()) return;

        if (this.getStorageUsername() !== '') loginName.val(this.getStorageUsername());

        if (this.getStoragePassword() !== '') loginPassword.val(this.getStoragePassword());

        $('#rememberMe').addClass('active');
    }

    findPath(
        character: Character,
        x: number,
        y: number,
        ignores: Character[],
        isObject?: boolean
    ): number[][] {
        const grid = this.entities.grids.pathingGrid;
        let path = [];

        if (this.map.isColliding(x, y) && !this.map.isObject(x, y)) return path;

        if (!this.pathfinder) return path;

        if (ignores)
            _.each(ignores, (entity) => {
                this.pathfinder.ignoreEntity(entity);
            });

        path = this.pathfinder.find(grid, character, x, y, false);

        if (ignores) this.pathfinder.clearIgnores();

        if (isObject) path.pop(); // Remove the last path index

        return path;
    }

    handleInput(inputType: number, data: unknown): void {
        this.input.handle(inputType, data);
    }

    handleDisconnection(noError?: boolean): void {
        /**
         * This function is responsible for handling sudden
         * disconnects of a player whilst in the game, not
         * menu-based errors.
         */

        if (!this.started) return;

        this.stop();
        this.renderer.stop();
        this.menu.stop();

        this.unload();

        this.app.showMenu();

        if (noError) {
            this.app.sendError(null, 'You have been disconnected from the server');
            this.app.statusMessage = null;
        }

        this.loadRenderer();
        this.loadControllers();

        this.app.toggleLogin(false);
        this.app.updateLoader('');
    }

    respawn(): void {
        this.audio.play(Modules.AudioTypes.SFX, 'revive');
        this.app.body.removeClass('death');

        this.socket.send(Packets.Respawn, [this.player.id]);
    }

    tradeWith(player: Player): void {
        if (!player || player.id === this.player.id) return;

        this.socket.send(Packets.Trade, [Packets.TradeOpcode.Request, player.id]);
    }

    resize(): void {
        this.renderer.resize();

        if (this.pointer) this.pointer.resize();
    }

    sendClientData(): void {
        const canvasWidth = this.renderer.canvasWidth,
            canvasHeight = this.renderer.canvasHeight;

        if (!canvasWidth || !canvasHeight) return;

        this.socket.send(Packets.Client, [canvasWidth, canvasHeight]);
    }

    createPlayer(): void {
        this.player = new Player();
    }

    isDebug(): boolean {
        return this.app.config.debug;
    }

    getScaleFactor(): number {
        return this.app.getScaleFactor();
    }

    getStorage(): Storage {
        return this.storage;
    }

    getCamera(): Camera {
        return this.renderer.camera;
    }

    getSprite(spriteName: string): Sprite {
        return this.entities.getSprite(spriteName);
    }

    getEntityAt(x: number, y: number, ignoreSelf: boolean): Entity {
        const entities = this.entities.grids.renderingGrid[y][x];

        if (_.size(entities) > 0) return entities[_.keys(entities)[ignoreSelf ? 1 : 0]];

        const items = this.entities.grids.itemGrid[y][x];

        if (_.size(items) > 0) {
            _.each(items, (item) => {
                if (item.stackable) return item;
            });

            return items[_.keys(items)[0]];
        }
    }

    getStorageUsername(): string {
        return this.storage.data.player.username;
    }

    getStoragePassword(): string {
        return this.storage.data.player.password;
    }

    hasRemember(): boolean {
        return this.storage.data.player.rememberMe;
    }

    setRenderer(renderer: Renderer): void {
        this.renderer ||= renderer;
    }

    setStorage(storage: Storage): void {
        this.storage ||= storage;
    }

    setSocket(socket: Socket): void {
        this.socket ||= socket;
    }

    setMessages(messages: Messages): void {
        this.messages ||= messages;
    }

    setUpdater(updater: Updater): void {
        this.updater ||= updater;
    }

    setEntityController(entities: Entities): void {
        this.entities ||= entities;
    }

    setInput(input: Input): void {
        if (!this.input) {
            this.input = input;
            this.renderer.setInput(this.input);
        }
    }

    setPathfinder(pathfinder) {
        this.pathfinder ||= pathfinder;
    }

    setInfo(info) {
        this.info ||= info;
    }

    setBubble(bubble) {
        this.bubble ||= bubble;
    }

    setPointer(pointer) {
        this.pointer ||= pointer;
    }

    setMenu(_menu) {
        this.menu ||= _menu;
    }

    setAudio(audio) {
        this.audio ||= audio;
    }
}
