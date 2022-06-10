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
    music: number;
    sfx: number;
    brightness: number;
    soundEnabled: boolean;
    centerCamera: boolean;
    debug: boolean;
    autoCentre: boolean;
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
    errorMessage: string;
    player: PlayerData;
    settings: Settings;
    map: RegionMapData;
}

let storage = window.localStorage,
    name = 'data';

export default class Storage {
    public data: StorageData = storage.data ? JSON.parse(storage.getItem(name)!) : this.create();

    public constructor() {
        if (this.isNewVersion()) this.set(this.create());
    }

    /**
     * Creates a new empty template for the storage data.
     * @returns A StorageData object containing default values.
     */

    private create(): StorageData {
        return {
            new: true,
            world: window.config.serverId,
            clientVersion: window.config.version,
            errorMessage: '',

            player: {
                username: '',
                password: '',
                autoLogin: false,
                rememberMe: false,
                orientation: Modules.Orientation.Down
            },

            settings: {
                music: 100,
                sfx: 100,
                brightness: 100,
                soundEnabled: true,
                centerCamera: true,
                debug: false,
                autoCentre: false,
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

    /**
     * Saves the data object in this class' instance
     * to the local storage.
     */

    public save(): void {
        if (this.data) storage.setItem(name, JSON.stringify(this.data));
    }

    /**
     * Clears the local storage and saves the empty
     * default parameters.
     */

    public clear(): void {
        storage.removeItem(name);

        this.set(this.create());

        this.save();
    }

    /**
     * Sets the data onto the local storage and saves it.
     * @param data The StorageData object we are writing.
     */

    public set(data: StorageData): void {
        this.data = data;
        this.save();
    }

    /**
     * Updates the error message in the storage.
     * @param error The new error message in the storage.
     */

    public setError(error: string): boolean {
        this.data.errorMessage = error;
        this.save();

        return true;
    }

    /**
     * Updates the player data remember me value.
     * @param rememberMe New value of the remember me toggle switch.
     */

    public setRemember(rememberMe: boolean): void {
        this.data.player.rememberMe = rememberMe;
        this.save();
    }

    /**
     * Sets the username and password into the local storage and saves it.
     * @param username The username string we are setting.
     * @param password The password string we are updating.
     */

    public setCredentials(username = '', password = ''): void {
        this.data.player.username = username;
        this.data.player.password = password;

        this.save();
    }

    /**
     * Updates the music volume and stores it into the local storage.
     * @param volume The new volume we are setting the music to.
     */

    public setVolume(volume = 100): void {
        this.data.settings.music = volume;

        this.save();
    }

    /**
     * Updates the SFX and stores it into the local storage.
     * @param volume New volume we are setting the SFX to.
     */

    public setSFX(volume = 100): void {
        this.data.settings.sfx = volume;

        this.save();
    }

    /**
     * Sets the brightness value in the storage.
     * @param brightness New brightness or default to 100 if not specified.
     */

    public setBrightness(brightness = 100): void {
        this.data.settings.brightness = brightness;

        this.save();
    }

    /**
     * Checks if the local storage verison of the client
     * matches the window's config version.
     * @returns True if client version is the same as config version.
     */

    private isNewVersion(): boolean {
        return this.data.clientVersion !== window.config.version;
    }

    /**
     * Updates the orientation in the local storage.
     * @param orientation New orientation we are saving.
     */

    public setOrientation(orientation: number): void {
        this.data.player.orientation = orientation;

        this.save();
    }

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
     * Grabs the error message from local storage
     * and immediately clears it. Error messages only
     * get displayed once if they're queued up.
     * @returns The string of the error message.
     */

    public getError(): string {
        let { errorMessage } = this.data;

        this.data.errorMessage = '';
        this.save();

        return errorMessage;
    }

    /**
     * @returns The username string stored in the local storage.
     */

    public getUsername(): string {
        return this.data.player.username;
    }

    /**
     * @returns The password string (raw text) in the local storage.
     */

    public getPassword(): string {
        return this.data.player.password;
    }

    /**
     * Whether or not the remember me toggle is on.
     * @returns Boolean value of the remember me toggle.
     */

    public hasRemember(): boolean {
        return this.data.player.rememberMe;
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
}
