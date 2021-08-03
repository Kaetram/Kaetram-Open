import { Modules } from '@kaetram/common/network';

import type App from '../app';
import type { CursorsTiles } from '../map/map';

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
    collisions: number[];
    objects: unknown[];
    cursorTiles: CursorsTiles;
}

interface StorageData {
    new: boolean;
    world: string;
    clientVersion: number;
    player: PlayerData;
    settings: Settings;
    map: RegionMapData;
}

let storage = window.localStorage,
    name = 'data';

export default class Storage {
    public data!: StorageData;

    public constructor(private app: App) {
        this.load();
    }

    private load(): void {
        this.data = storage.data ? JSON.parse(storage.getItem(name)!) : this.create();

        if (this.data.clientVersion !== parseFloat(this.app.config.version)) {
            this.data = this.create();
            this.save();
        }
    }

    private create(): StorageData {
        return {
            new: true,
            world: window.config.serverId,
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

    public save(): void {
        if (this.data) storage.setItem(name, JSON.stringify(this.data));
    }

    public clear(): void {
        storage.removeItem(name);
        this.data = this.create();
    }

    public toggleRemember(toggle: boolean): void {
        this.data.player.rememberMe = toggle;
        this.save();
    }

    public setOrientation(orientation: number): void {
        let player = this.getPlayer();

        player.orientation = orientation;

        this.save();
    }

    // setPlayer(option: keyof PlayerData, value: never): void {
    //     let pData = this.getPlayer();

    //     if (option in pData) pData[option] = value;

    //     this.save();
    // }

    // setSettings(option: keyof Settings, value: never): void {
    //     let sData = this.getSettings();

    //     if (option in sData) sData[option] = value;

    //     this.save();
    // }

    public setRegionData(
        regionData: number[],
        collisionData: number[],
        objects: unknown[],
        cursorTiles: CursorsTiles
    ): void {
        this.data.map.regionData = regionData;
        this.data.map.collisions = collisionData;
        this.data.map.objects = objects;
        this.data.map.cursorTiles = cursorTiles;

        this.save();
    }

    public getPlayer(): PlayerData {
        return this.data.player;
    }

    public getSettings(): Settings {
        return this.data.settings;
    }

    public getRegionData(): number[] {
        return this.data.map.regionData;
    }

    public getCollisions(): number[] {
        return this.data.map.collisions;
    }

    public getObjects(): unknown[] {
        return this.data.map.objects;
    }
    public getCursorTiles(): CursorsTiles {
        return this.data.map.cursorTiles;
    }
}
