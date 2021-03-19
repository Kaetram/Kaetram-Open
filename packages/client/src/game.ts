import $ from 'jquery';
import _ from 'lodash';

import App from './app';
import AudioController from './controllers/audio';
import BubbleController from './controllers/bubble';
import EntitiesController from './controllers/entities';
import InfoController from './controllers/info';
import InputController from './controllers/input';
import MenuController from './controllers/menu';
import Pointer from './controllers/pointer';
import Zoning from './controllers/zoning';
import Character from './entity/character/character';
import Player from './entity/character/player/player';
import PlayerHandler from './entity/character/player/playerhandler';
import Entity from './entity/entity';
import Sprite from './entity/sprite';
import Map from './map/map';
import Inventory from './menu/inventory';
import Connection from './network/connection';
import Messages from './network/messages';
import Packets from '@kaetram/common/src/packets';
import Socket from './network/socket';
import Camera from './renderer/camera';
import Overlay from './renderer/overlay';
import Renderer from './renderer/renderer';
import Updater from './renderer/updater';
import { getUserAgent, supportsWebGL } from './utils/detect';
import * as Modules from '@kaetram/common/src/modules';
import Pathfinder from './utils/pathfinder';
import Storage from './utils/storage';

export default class Game {
    public id = -1;

    public socket!: Socket | null;
    public messages!: Messages | null;
    public renderer!: Renderer | null;
    private updater!: Updater | null;
    public storage!: Storage | null;
    public entities!: EntitiesController | null;
    public input!: InputController | null;
    public map!: Map | null;
    private pathfinder!: Pathfinder | null;
    public zoning!: Zoning | null;
    public info!: InfoController | null;
    public menu!: MenuController | null;
    public audio!: AudioController | null;
    public player!: Player | null;

    private stopped = false;
    public started = false;
    public ready = false;

    public time = Date.now();

    public pvp = false;
    // population = -1;

    public lastTime = Date.now();

    public overlays!: Overlay;
    private connectionHandler!: Connection;
    public pointer!: Pointer;
    public bubble!: BubbleController;
    public camera!: Camera;
    public inventory!: Inventory;
    public development!: boolean;

    public constructor(public app: App) {
        this.loadRenderer();
        this.loadControllers();

        app.setGame(this);
    }

    public start(): void {
        if (this.started) return;

        this.app.fadeMenu();
        this.tick();

        this.started = true;
    }

    private stop(): void {
        this.stopped = false;
        this.started = false;
        this.ready = false;
    }

    private tick(): void {
        if (this.ready) {
            this.time = Date.now();

            this.renderer?.render();
            this.updater?.update();

            if (!this.stopped) requestAnimationFrame(() => this.tick());
        }
    }

    private unload(): void {
        this.socket = null;
        this.messages = null;
        this.renderer = null;
        this.updater = null;
        this.storage = null;
        this.entities = null;
        this.input = null;
        this.map = null;
        this.player = null;
        this.pathfinder = null;
        this.zoning = null;
        this.info = null;
        this.menu = null;

        this.audio?.stop();
        this.audio = null;
    }

    private loadRenderer(): void {
        const background = document.querySelector('#background') as HTMLCanvasElement,
            foreground = document.querySelector('#foreground') as HTMLCanvasElement,
            overlay = document.querySelector('#overlay') as HTMLCanvasElement,
            textCanvas = document.querySelector('#textCanvas') as HTMLCanvasElement,
            entities = document.querySelector('#entities') as HTMLCanvasElement,
            cursor = document.querySelector('#cursor') as HTMLCanvasElement;

        this.app.sendStatus('Initializing render engine');

        this.setRenderer(
            new Renderer(background, entities, foreground, overlay, textCanvas, cursor, this)
        );
    }

    private loadControllers(): void {
        const hasWorker = this.app.hasWorker();

        this.app.sendStatus('Loading local storage');

        this.setStorage(new Storage(this.app));

        this.app.sendStatus(hasWorker ? 'Loading maps - asynchronous' : null);

        if (hasWorker) this.loadMap();

        this.app.sendStatus('Initializing network socket');

        this.setSocket(new Socket(this));
        this.setMessages(this?.socket?.messages || null);
        this.setInput(new InputController(this));

        this.app.sendStatus('Loading controllers');

        this.setEntityController(new EntitiesController(this));

        this.setInfo(new InfoController(this));

        this.setBubble(new BubbleController(this));

        this.setPointer(new Pointer(this));

        this.setAudio(new AudioController(this));

        this.setMenu(new MenuController(this));

        this.loadStorage();

        if (!hasWorker) this.app.ready();
    }

    public loadMap(): void {
        this.map = new Map(this);
        this.overlays = new Overlay(this);

        this.map.onReady(async () => {
            const map = this.map as Map;

            if (!this.isDebug()) map.loadRegionData();

            this.app.sendStatus('Loading the pathfinder');

            this.setPathfinder(new Pathfinder(map.width, map.height));

            this.renderer?.setMap(map);
            this.renderer?.loadCamera();

            this.app.sendStatus('Loading updater');

            this.setUpdater(new Updater(this));

            await this.entities?.load();

            this.renderer?.setEntities(this.entities);

            if (supportsWebGL()) map.loadWebGL(this.renderer?.backContext as WebGLRenderingContext);

            this.app.ready();
        });
    }

    public connect(): void {
        this.app.cleanErrors();

        window.setTimeout(() => this.socket?.connect(), 1000);

        this.connectionHandler = new Connection(this);
    }

    /**
     * Call this after the player has been welcomed
     * by the server and the client received the connection.
     */
    public postLoad(): void {
        const { renderer, player, entities, updater, storage, socket, map } = this;
        if (!(renderer && player && entities && updater)) return;

        renderer.loadStaticSprites();

        this.getCamera()?.setPlayer(player);

        entities.addEntity(player);

        const defaultSprite = this.getSprite(player.getSpriteName());

        player.setSprite(defaultSprite);
        if (storage) player.setOrientation(storage.data.player.orientation);
        player.idle();

        if (map) socket?.send(Packets.Ready, [true, map.preloadedData, getUserAgent()]);
        this.sendClientData();

        new PlayerHandler(this, player);

        renderer.updateAnimatedTiles();

        this.zoning = new Zoning();

        updater.setSprites(entities.sprites);

        renderer.verifyCentration();

        if (storage?.data.new) {
            storage.data.new = false;
            storage.save();
        }
    }

    private loadStorage(): void {
        const loginName = $('#loginNameInput'),
            loginPassword = $('#loginPasswordInput');

        loginName.prop('readonly', false);
        loginPassword.prop('readonly', false);

        if (!this.hasRemember()) return;

        if (this.getStorageUsername() !== '') loginName.val(this.getStorageUsername() as string);

        if (this.getStoragePassword() !== '')
            loginPassword.val(this.getStoragePassword() as string);

        $('#rememberMe').prop('checked', true);
    }

    public findPath(
        character: Character,
        x: number,
        y: number,
        ignores: Character[],
        isObject?: boolean
    ): number[][] {
        const grid = this.entities?.grids.pathingGrid as number[][];
        let path: number[][] = [];

        if (this.map?.isColliding(x, y) && !this.map.isObject(x, y)) return path;

        if (!this.pathfinder) return path;

        if (ignores) _.each(ignores, (entity) => this.pathfinder?.ignoreEntity(entity));

        path = this.pathfinder.find(grid, character, x, y, false);

        if (ignores) this.pathfinder.clearIgnores();

        if (isObject) path.pop(); // Remove the last path index

        return path;
    }

    public handleInput(inputType: number, data: number): void {
        this.input?.handle(inputType, data);
    }

    /**
     * This method is responsible for handling sudden
     * disconnects of a player whilst in the game, not
     * menu-based errors.
     */
    public handleDisconnection(noError?: boolean): void {
        if (!this.started) return;

        this.stop();
        this.renderer?.stop();
        this.menu?.stop();

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

    public respawn(): void {
        this.audio?.play(Modules.AudioTypes.SFX, 'revive');
        this.app.body.removeClass('death');

        this.socket?.send(Packets.Respawn, [this.player?.id]);
    }

    // tradeWith(player: Player): void {
    //     if (!player || player.id === this.player?.id) return;

    //     this.socket?.send(Packets.Trade, [Packets.TradeOpcode.Request, player.id]);
    // }

    public resize(): void {
        this.renderer?.resize();

        this.pointer?.resize();
    }

    public sendClientData(): void {
        const canvasWidth = this.renderer?.canvasWidth,
            canvasHeight = this.renderer?.canvasHeight;

        if (!canvasWidth || !canvasHeight) return;

        this.socket?.send(Packets.Client, [canvasWidth, canvasHeight]);
    }

    public createPlayer(): void {
        this.player = new Player();
    }

    public isDebug(): boolean {
        return this.app.config.debug;
    }

    public getScaleFactor(): number {
        return this.app.getScaleFactor();
    }

    public getCamera(): Camera {
        return this.renderer?.camera as Camera;
    }

    public getSprite(spriteName: string): Sprite | undefined {
        return this.entities?.getSprite(spriteName);
    }

    public getEntityAt(x: number, y: number, ignoreSelf: boolean): Entity | undefined {
        if (!this.entities) return;

        const entities = this.entities.grids.renderingGrid[y][x];

        if (_.size(entities) > 0) return entities[_.keys(entities)[ignoreSelf ? 1 : 0]];

        const items = this.entities.grids.itemGrid[y][x];

        if (_.size(items) > 0) return items[_.keys(items)[0]];
    }

    private getStorageUsername(): string | undefined {
        return this.storage?.data.player.username;
    }

    private getStoragePassword(): string | undefined {
        return this.storage?.data.player.password;
    }

    public hasRemember(): boolean | undefined {
        return this.storage?.data.player.rememberMe;
    }

    public setRenderer(renderer: Renderer): void {
        this.renderer ||= renderer;
    }

    private setStorage(storage: Storage): void {
        this.storage ||= storage;
    }

    private setSocket(socket: Socket): void {
        this.socket ||= socket;
    }

    private setMessages(messages: Messages | null): void {
        this.messages ||= messages;
    }

    private setUpdater(updater: Updater): void {
        this.updater ||= updater;
    }

    private setEntityController(entities: EntitiesController): void {
        this.entities ||= entities;
    }

    private setInput(input: InputController): void {
        if (!this.input) {
            this.input = input;
            this.renderer?.setInput(this.input);
        }
    }

    private setPathfinder(pathfinder: Pathfinder): void {
        this.pathfinder ||= pathfinder;
    }

    private setInfo(info: InfoController): void {
        this.info ||= info;
    }

    private setBubble(bubble: BubbleController): void {
        this.bubble ||= bubble;
    }

    private setPointer(pointer: Pointer): void {
        this.pointer ||= pointer;
    }

    private setMenu(menu: MenuController): void {
        this.menu ||= menu;
    }

    private setAudio(audio: AudioController): void {
        this.audio ||= audio;
    }
}
