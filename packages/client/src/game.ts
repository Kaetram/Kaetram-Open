import $ from 'jquery';
import _ from 'lodash';

import { Modules, Packets } from '@kaetram/common/network';

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
import Socket from './network/socket';
import Camera from './renderer/camera';
import Overlay from './renderer/overlay';
import Renderer from './renderer/renderer';
import Updater from './renderer/updater';
import { agent, supportsWebGL } from './utils/detect';
import Pathfinder from './utils/pathfinder';
import Storage from './utils/storage';

import type { APIData } from '@kaetram/common/types/api';

export default class Game {
    public id!: string;

    public socket!: Socket;
    public messages!: Messages;
    public renderer!: Renderer;
    private updater!: Updater;
    public storage!: Storage;
    public entities!: EntitiesController;
    public input!: InputController;
    public map!: Map;
    private pathfinder!: Pathfinder;
    public zoning!: Zoning;
    public info!: InfoController;
    public menu!: MenuController;
    public audio!: AudioController;
    public player!: Player;

    private stopped = false;
    public started = false;
    public ready = false;

    public time = Date.now();
    public lastTime = Date.now();

    public pvp = false;
    // population = -1;

    public overlays!: Overlay;
    // private connectionHandler!: Connection;
    public pointer!: Pointer;
    public bubble!: BubbleController;
    public camera!: Camera;
    public inventory!: Inventory;

    public world!: APIData;

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

            this.renderer.render();
            this.updater.update();

            if (!this.stopped) requestAnimationFrame(() => this.tick());
        }
    }

    private unload(): void {
        this.socket = null!;
        this.messages = null!;
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

    private loadRenderer(): void {
        let background = document.querySelector<HTMLCanvasElement>('#background')!,
            foreground = document.querySelector<HTMLCanvasElement>('#foreground')!,
            overlay = document.querySelector<HTMLCanvasElement>('#overlay')!,
            textCanvas = document.querySelector<HTMLCanvasElement>('#textCanvas')!,
            entities = document.querySelector<HTMLCanvasElement>('#entities')!,
            cursor = document.querySelector<HTMLCanvasElement>('#cursor')!;

        this.app.sendStatus('Initializing render engine');

        this.setRenderer(
            new Renderer(background, entities, foreground, overlay, textCanvas, cursor, this)
        );
    }

    private loadControllers(): void {
        let { app } = this,
            { config } = app;

        app.sendStatus('Loading local storage');

        this.setStorage(new Storage(app));

        if (config.worldSwitch) $.get(`${config.hub}/all`, (servers) => this.loadWorlds(servers));

        this.loadMap();

        app.sendStatus('Initializing network socket');

        this.setSocket(new Socket(this));
        let { socket } = this;
        this.setMessages(socket.messages);
        this.setInput(new InputController(this));

        app.sendStatus('Loading controllers');

        this.setEntityController(new EntitiesController(this));

        this.setInfo(new InfoController(this));

        this.setBubble(new BubbleController(this));

        this.setPointer(new Pointer(this));

        this.setAudio(new AudioController(this));

        this.setMenu(new MenuController(this));

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

    public loadMap(): void {
        this.map = new Map(this);
        this.overlays = new Overlay();

        let { map } = this;

        map.onReady(() => {
            let { map, app, renderer, entities } = this;

            if (!map) return;

            if (!this.isDebug()) map.loadRegionData();

            app.sendStatus('Loading the pathfinder');

            this.setPathfinder(new Pathfinder(map.width, map.height));

            renderer.setMap(map);
            renderer.loadCamera();

            app.sendStatus('Loading updater');

            this.setUpdater(new Updater(this));

            entities.load();

            renderer.setEntities(entities);

            if (supportsWebGL()) map.loadWebGL(renderer.backContext as WebGLRenderingContext);

            app.ready();
        });
    }

    public connect(): void {
        let { app, socket } = this;

        app.cleanErrors();

        socket.connect();

        // this.connectionHandler =
        new Connection(this);
    }

    /**
     * Call this after the player has been welcomed
     * by the server and the client received the connection.
     */
    public postLoad(): void {
        let { renderer, player, entities, updater, storage, socket, map } = this;
        if (!(renderer && player && entities && updater)) return;

        renderer.loadStaticSprites();

        this.getCamera().setPlayer(player);

        entities.addEntity(player);

        let defaultSprite = this.getSprite(player.getSpriteName());

        player.setSprite(defaultSprite);
        if (storage) player.setOrientation(storage.data.player.orientation);
        player.idle();

        if (map) socket.send(Packets.Ready, [true, map.preloadedData, agent]);
        this.sendClientData();

        new PlayerHandler(this, player);

        renderer.updateAnimatedTiles();

        this.zoning = new Zoning();

        updater.setSprites(entities.sprites);

        renderer.verifyCentration();

        if (storage.data.new) {
            storage.data.new = false;
            storage.save();
        }
    }

    private loadStorage(): void {
        let loginName = $('#loginNameInput'),
            loginPassword = $('#loginPasswordInput');

        loginName.prop('readonly', false);
        loginPassword.prop('readonly', false);

        if (!this.hasRemember()) return;

        if (this.getStorageUsername() !== '') loginName.val(this.getStorageUsername()!);

        if (this.getStoragePassword() !== '') loginPassword.val(this.getStoragePassword()!);

        $('#rememberMe').prop('checked', true);
    }

    public findPath(
        character: Character,
        x: number,
        y: number,
        ignores: Character[],
        isObject = false
    ): number[][] {
        let { entities, map, pathfinder } = this,
            grid = entities.grids.pathingGrid,
            path: number[][] = [];

        if (map.isColliding(x, y) && !map.isObject(x, y)) return path;

        if (!pathfinder) return path;

        if (ignores) _.each(ignores, (entity) => pathfinder.ignoreEntity(entity));

        path = pathfinder.find(grid, character, x, y, false);

        if (ignores) pathfinder.clearIgnores();

        if (isObject) path.pop(); // Remove the last path index

        return path;
    }

    public handleInput(inputType: number, data: number): void {
        this.input.handle(inputType, data);
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

        this.loadRenderer();
        this.loadControllers();

        app.toggleLogin(false);
        app.updateLoader('');
    }

    public respawn(): void {
        let { audio, app, socket, player } = this;

        audio.play(Modules.AudioTypes.SFX, 'revive');
        app.body.removeClass('death');

        socket.send(Packets.Respawn, [player.id]);
    }

    // tradeWith(player: Player): void {
    //     if (!player || player.id === this.player.id) return;

    //     this.socket.send(Packets.Trade, [Opcodes.Trade.Request, player.id]);
    // }

    public resize(): void {
        this.renderer.resize();

        this.pointer.resize();
    }

    public sendClientData(): void {
        let { canvasWidth, canvasHeight } = this.renderer;

        if (!canvasWidth || !canvasHeight) return;

        this.socket.send(Packets.Client, [canvasWidth, canvasHeight]);
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
        return this.renderer.camera!;
    }

    public getSprite(spriteName: string): Sprite | undefined {
        return this.entities.getSprite(spriteName);
    }

    public getEntityAt(x: number, y: number, ignoreSelf: boolean): Entity | undefined {
        if (!this.entities) return;

        let entities = this.entities.grids.renderingGrid[y][x];

        if (_.size(entities) > 0) return entities[_.keys(entities)[ignoreSelf ? 1 : 0]];

        let items = this.entities.grids.itemGrid[y][x];

        if (_.size(items) > 0) return items[_.keys(items)[0]];
    }

    private getStorageUsername(): string | undefined {
        return this.storage.data.player.username;
    }

    private getStoragePassword(): string | undefined {
        return this.storage.data.player.password;
    }

    public hasRemember(): boolean | undefined {
        return this.storage.data.player.rememberMe;
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

    private setMessages(messages: Messages): void {
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
            this.renderer.setInput(this.input);
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
