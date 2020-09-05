const storage = window.localStorage;
const name = 'data';
import App from '../app';
import { MapCollisions } from '../map/map';
import Modules from './modules';

interface PlayerData {
    username: string;
    password: string;
    autoLogin: boolean;
    rememberMe: boolean;
    orientation: number;
}

interface Settings {
    autoCentre: boolean;
    music: number;
    sfx: number;
    brightness: number;
    soundEnabled: boolean;
    FPSCap: boolean;
    centerCamera: boolean;
    debug: boolean;
    showNames: boolean;
    showLevels: boolean;
}

interface RegionMapData {
    regionData: number[];
    collisions: MapCollisions;
    objects: unknown[];
    cursorTiles: { [key: string]: string };
}

interface StorageData {
    new: boolean;
    clientVersion: number;

    player: PlayerData;

    settings: Settings;

    map: RegionMapData;
}

export default class Storage {
    app: App;
    data: StorageData;

    constructor(app: App) {
        this.app = app;
        this.data = null;

        this.load();
    }

    load(): void {
        if (storage.data) this.data = JSON.parse(storage.getItem(name));
        else this.data = this.create();

        if (this.data.clientVersion !== parseFloat(this.app.config.version)) {
            this.data = this.create();
            this.save();
        }
    }

    create(): StorageData {
        return {
            new: true,
            clientVersion: parseFloat(this.app.config.version),

            player: {
                username: '',
                password: '',
                autoLogin: false,
                rememberMe: false,
                orientation: Modules.Orientation.Down
            },

            settings: {
                autoCentre: false,
                music: 100,
                sfx: 100,
                brightness: 100,
                soundEnabled: true,
                FPSCap: true,
                centerCamera: true,
                debug: false,
                showNames: true,
                showLevels: true
            },

            map: {
                regionData: [],
                collisions: [],
                objects: [],
                cursorTiles: {}
            }
        };
    }

    save(): void {
        if (this.data) storage.setItem(name, JSON.stringify(this.data));
    }

    clear(): void {
        storage.removeItem(name);
        this.data = this.create();
    }

    toggleRemember(toggle: boolean): void {
        this.data.player.rememberMe = toggle;
        this.save();
    }

    setOrientation(orientation: number): void {
        const player = this.getPlayer();

        player.orientation = orientation;

        this.save();
    }

    setPlayer(option: keyof PlayerData, value: never): void {
        const pData = this.getPlayer();

        if (Object.prototype.hasOwnProperty.call(pData, option)) pData[option] = value;

        this.save();
    }

    setSettings(option: keyof Settings, value: never): void {
        const sData = this.getSettings();

        if (Object.prototype.hasOwnProperty.call(sData, option)) sData[option] = value;

        this.save();
    }

    setRegionData(
        regionData: number[],
        collisionData: MapCollisions,
        objects: unknown[],
        cursorTiles: { [key: string]: string }
    ): void {
        this.data.map.regionData = regionData;
        this.data.map.collisions = collisionData;
        this.data.map.objects = objects;
        this.data.map.cursorTiles = cursorTiles;

        this.save();
    }

    getPlayer(): PlayerData {
        return this.data.player;
    }

    getSettings(): Settings {
        return this.data ? this.data.settings : null;
    }

    getRegionData(): number[] {
        return this.data.map.regionData;
    }

    getCollisions(): MapCollisions {
        return this.data.map.collisions;
    }

    getObjects(): unknown[] {
        return this.data.map.objects;
    }
    getCursorTiles(): { [key: string]: string } {
        return this.data.map.cursorTiles;
    }
}
