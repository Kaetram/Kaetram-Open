import { Modules } from '@kaetram/common/network';
import { CursorTiles } from '../map/map';

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
    grid: number[][];
    objects: number[];
    cursorTiles: CursorTiles;
}

interface StorageData {
    new: boolean;
    world: number;
    clientVersion: string;
    player: PlayerData;
    settings: Settings;
    map: RegionMapData;
}

let storage = window.localStorage,
    name = 'data';

export default class Storage {
    public data!: StorageData;

    public constructor() {
        this.load();
    }

    private load(): void {
        this.data = storage.data ? JSON.parse(storage.getItem(name)!) : this.create();

        if (this.data.clientVersion !== window.config.version) {
            this.data = this.create();
            this.save();
        }
    }

    private create(): StorageData {
        return {
            new: true,
            world: window.config.serverId,
            clientVersion: window.config.version,

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
                grid: [],
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

    /**
     * Sets the data loaded so far from the map into the storage.
     * @param regionData The tile data for each index.
     * @param grid The collision grid for the map.
     * @param objects The object tileIds.
     * @param cursorTiles The cursor tileIds.
     */

    public setRegionData(
        regionData: number[],
        grid: number[][],
        objects: number[],
        cursorTiles: CursorTiles
    ): void {
        this.data.map.regionData = regionData;
        this.data.map.grid = grid;
        this.data.map.objects = objects;
        this.data.map.cursorTiles = cursorTiles;

        this.save();
    }

    /**
     * Grabs the local storage data of the map.
     * @returns RegionMapData object containing all the data stored so far.
     */

    public getRegionData(): RegionMapData {
        return {
            regionData: this.data.map.regionData,
            grid: this.data.map.grid,
            objects: this.data.map.objects,
            cursorTiles: this.data.map.cursorTiles
        };
    }

    public getUsername(): string {
        return this.data.player.username;
    }

    public getPassword(): string {
        return this.data.player.password;
    }

    public hasRemember(): boolean {
        return this.data.player.rememberMe;
    }

    public getPlayer(): PlayerData {
        return this.data.player;
    }

    public getSettings(): Settings {
        return this.data.settings;
    }
}
