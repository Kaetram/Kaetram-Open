import _ from 'underscore';

import App from './app';
import Audio from './controllers/audio';
import Bubble from './controllers/bubble';
import Entities from './controllers/entities';
import Info from './controllers/info';
import Input from './controllers/input';
import Interface from './controllers/interface';
import Pointers from './controllers/pointer';
import Zoning from './controllers/zoning';
import Player from './entity/character/player/player';
import PlayerHandler from './entity/character/player/playerhandler';
import Map from './map/map';
import Connection from './network/connection';
import Messages from './network/messages';
import Packets from './network/packets';
import Socket from './network/socket';
import Overlay from './renderer/overlay';
import Renderer from './renderer/renderer';
import Updater from './renderer/updater';
import Detect from './utils/detect';
import Modules from './utils/modules';
import Pathfinder from './utils/pathfinder';
import LocalStorage from './utils/storage';
import Item from './entity/objects/item';
import Inventory from './interface/inventory';
import Camera from './renderer/camera';

export default class Game {
    id: number;
    socket: Socket;
    messages: Messages;
    renderer: Renderer;
    updater: Updater;
    storage: LocalStorage;
    entities: Entities;
    input: Input;
    map: Map;
    playerHandler: PlayerHandler;
    pathfinder: Pathfinder;
    zoning: Zoning;
    info: Info;
    interface: Interface;
    audio: Audio;
    player: Player;
    stopped: boolean;
    started: boolean;
    ready: boolean;
    loaded: boolean;
    pvp: boolean;
    population: number;
    lastTime: number;
    overlays: Overlay;
    connectionHandler: Connection;
    pointer: Pointers;
    bubble: Bubble;
    time: number;
    inventory: Inventory;
    development: boolean;
    camera: Camera;

    constructor(public app: App) {
        this.id = -1;

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

    start() {
        if (this.started) return;

        this.app.fadeMenu();
        this.tick();

        this.started = true;
    }

    stop() {
        this.stopped = false;
        this.started = false;
        this.ready = false;
    }

    tick() {
        if (this.ready) {
            this.time = new Date().getTime();

            this.renderer.render();
            this.updater.update();

            if (!this.stopped) requestAnimationFrame(this.tick.bind(this));
        }
    }

    unload() {
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
        this.interface = null;

        this.audio.stop();
        this.audio = null;
    }

    loadRenderer() {
        const background = document.getElementById('background');
        const foreground = document.getElementById('foreground');
        const overlay = document.getElementById('overlay');
        const textCanvas = document.getElementById('textCanvas');
        const entities = document.getElementById('entities');
        const cursor = document.getElementById('cursor');

        this.app.sendStatus('Initializing render engine');

        this.setRenderer(
            new Renderer(
                background,
                entities,
                foreground,
                overlay,
                textCanvas,
                cursor,
                this
            )
        );
    }

    loadControllers() {
        const hasWorker = this.app.hasWorker();

        this.app.sendStatus('Loading local storage');

        this.setStorage(new LocalStorage(this.app));

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

        this.setPointer(new Pointers(this));

        this.setAudio(new Audio(this));

        this.setInterface(new Interface(this));

        this.loadStorage();

        if (!hasWorker) {
            this.app.sendStatus(null);
            this.loaded = true;
        }
    }

    loadMap() {
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

            if (Detect.supportsWebGL()) {
                this.map.loadWebGL(this.renderer.backContext);
            }

            this.loaded = true;
        });
    }

    connect() {
        this.app.cleanErrors();

        setTimeout(() => {
            this.socket.connect();
        }, 1000);

        this.connectionHandler = new Connection(this);
    }

    postLoad() {
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

        this.socket.send(Packets.Ready, [
            true,
            this.map.preloadedData,
            Detect.getUserAgent(),
        ]);

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

    loadStorage() {
        const loginName = $('#loginNameInput');
        const loginPassword = $('#loginPasswordInput');

        loginName.prop('readonly', false);
        loginPassword.prop('readonly', false);

        if (!this.hasRemember()) return;

        if (this.getStorageUsername() !== '') {
            loginName.val(this.getStorageUsername());
        }

        if (this.getStoragePassword() !== '') {
            loginPassword.val(this.getStoragePassword());
        }

        $('#rememberMe').addClass('active');
    }

    findPath(character, x, y, ignores) {
        const grid = this.entities.grids.pathingGrid;
        let path = [];

        if (this.map.isColliding(x, y) || !this.pathfinder || !character) {
            return path;
        }

        if (ignores) {
            _.each(ignores, (entity) => {
                this.pathfinder.ignoreEntity(entity);
            });
        }

        path = this.pathfinder.find(grid, character, x, y, false);

        if (ignores) this.pathfinder.clearIgnores();

        return path;
    }

    handleInput(inputType, data) {
        this.input.handle(inputType, data);
    }

    /**
     * This function is responsible for handling sudden
     * disconnects of a player whilst in the game, not
     * menu-based errors.
     */
    handleDisconnection(noError?: boolean) {
        if (!this.started) return;

        this.stop();
        this.renderer.stop();
        this.interface.stop();

        this.unload();

        this.app.showMenu();

        if (noError) {
            this.app.sendError(
                null,
                'You have been disconnected from the server'
            );
            this.app.statusMessage = null;
        }

        this.loadRenderer();
        this.loadControllers();

        this.app.toggleLogin(false);
        this.app.updateLoader('');
    }

    respawn() {
        this.audio.play(Modules.AudioTypes.SFX, 'revive');
        this.app.body.removeClass('death');

        this.socket.send(Packets.Respawn, [this.player.id]);
    }

    tradeWith(player) {
        if (!player || player.id === this.player.id) return;

        this.socket.send(Packets.Trade, [
            Packets.TradeOpcode.Request,
            player.id,
        ]);
    }

    resize() {
        this.renderer.resize();

        if (this.pointer) this.pointer.resize();
    }

    createPlayer() {
        this.player = new Player();
    }

    isDebug() {
        return this.app.config.debug;
    }

    getScaleFactor() {
        return this.app.getScaleFactor();
    }

    getStorage() {
        return this.storage;
    }

    getCamera() {
        return this.renderer.camera;
    }

    getSprite(spriteName) {
        return this.entities.getSprite(spriteName);
    }

    getEntityAt(x, y, ignoreSelf) {
        const entities = this.entities.grids.renderingGrid[y][x];

        if (_.size(entities) > 0) {
            return entities[_.keys(entities)[ignoreSelf ? 1 : 0]];
        }

        const items = this.entities.grids.itemGrid[y][x];

        if (_.size(items) > 0) {
            _.each(items, (item: Item) => {
                if (item.stackable) return item;
            });

            return items[_.keys(items)[0]];
        }
    }

    getStorageUsername() {
        return this.storage.data.player.username;
    }

    getStoragePassword() {
        return this.storage.data.player.password;
    }

    hasRemember() {
        return this.storage.data.player.rememberMe;
    }

    setRenderer(renderer) {
        if (!this.renderer) this.renderer = renderer;
    }

    setStorage(storage) {
        if (!this.storage) this.storage = storage;
    }

    setSocket(socket) {
        if (!this.socket) this.socket = socket;
    }

    setMessages(messages) {
        if (!this.messages) this.messages = messages;
    }

    setUpdater(updater) {
        if (!this.updater) this.updater = updater;
    }

    setEntityController(entities) {
        if (!this.entities) this.entities = entities;
    }

    setInput(input) {
        if (!this.input) {
            this.input = input;
            this.renderer.setInput(this.input);
        }
    }

    setPathfinder(pathfinder) {
        if (!this.pathfinder) this.pathfinder = pathfinder;
    }

    setInfo(info) {
        if (!this.info) this.info = info;
    }

    setBubble(bubble) {
        if (!this.bubble) this.bubble = bubble;
    }

    setPointer(pointer) {
        if (!this.pointer) this.pointer = pointer;
    }

    setInterface(intrface) {
        if (!this.interface) this.interface = intrface;
    }

    setAudio(audio) {
        if (!this.audio) this.audio = audio;
    }
}
