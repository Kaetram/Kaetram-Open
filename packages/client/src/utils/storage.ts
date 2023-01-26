import { isMobile } from './detect';

import log from '../lib/log';

import { Modules } from '@kaetram/common/network';

import type { RegionData, RegionTileData } from '@kaetram/common/types/map';
import type { CursorTiles } from '../map/map';

interface PlayerData {
    username: string;
    password: string;
    autoLogin: boolean;
    rememberMe: boolean;
    orientation: number;
    zoom: number;
}

interface Settings {
    musicVolume: number;
    soundVolume: number;
    brightness: number;
    audioEnabled: boolean;
    lowPowerMode: boolean;
    debugMode: boolean;
    showNames: boolean;
    showLevels: boolean;
    disableCaching: boolean;
}

interface RegionMapData {
    regionData: RegionData;
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
}

let storage = window.localStorage,
    name = 'data';

export default class Storage {
    public data: StorageData = storage.data ? JSON.parse(storage.getItem(name)!) : this.create();
    public mapData!: IDBDatabase; // Where we store the region caching.

    public newVersion = false;

    public constructor() {
        this.newVersion = this.isNewVersion();

        if (this.newVersion) {
            this.set(this.create());
            this.clearIndexedDB();
        } else this.loadIndexedDB();
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
                orientation: Modules.Orientation.Down,
                zoom: 3
            },

            settings: {
                musicVolume: 100,
                soundVolume: 100,
                brightness: 100,
                audioEnabled: !isMobile(),
                lowPowerMode: false,
                debugMode: false,
                showNames: true,
                showLevels: true,
                disableCaching: false
            }
        };
    }

    /**
     * Handles the creation of the IndexedDB database and population for the first run. This is
     * where we store all of the map data for the regions.
     */

    private loadIndexedDB(): void {
        let request: IDBOpenDBRequest = window.indexedDB?.open('mapCache', this.getDBVersion());

        // If something goes wrong just re-create the database.
        request.addEventListener('error', () => {
            this.clearIndexedDB();
        });

        // Upgrade occurs when we change the version of the database (or a new one is created).
        request.addEventListener('upgradeneeded', (event: Event) => {
            let database = (event.target as IDBOpenDBRequest).result;

            if (!database) console.error('Could not open IndexedDB database.');

            // Create the object stores for the map data.
            database.createObjectStore('regions');
            database.createObjectStore('objects');
            database.createObjectStore('cursorTiles');

            log.debug(`IndexedDB created with version ${this.getDBVersion()}.`);
        });

        // Successfully managed to open the database.
        request.addEventListener('success', (event: Event) => {
            this.mapData = (event.target as IDBOpenDBRequest).result;

            log.debug(`Successfully opened IndexedDB with version ${this.getDBVersion()}.`);
        });
    }

    /**
     * Saves the data object in this class' instance
     * to the local storage.
     */

    public save(): void {
        try {
            if (this.data) storage.setItem(name, JSON.stringify(this.data));
        } catch (error) {
            console.error(error);
        }
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
     * Deletes the IndexedDB database and recreates it.
     */

    private clearIndexedDB(): void {
        this.mapData?.close();

        window.indexedDB.deleteDatabase('mapCache');

        this.loadIndexedDB();
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
     * Updates the music music and stores it into the local storage.
     * @param volume The new music we are setting the music to.
     */

    public setMusicVolume(volume = 100): void {
        this.data.settings.musicVolume = volume;

        this.save();
    }

    /**
     * Updates the Sound and stores it into the local storage.
     * @param volume New music we are setting the Sound to.
     */

    public setSoundVolume(volume = 100): void {
        this.data.settings.soundVolume = volume;

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
     * Updates the local storage value for audioEnabled.
     * @param enabled New value to update variable to.
     */

    public setAudioEnabled(enabled: boolean): void {
        this.data.settings.audioEnabled = enabled;

        this.save();
    }

    /**
     * Sets the value of the low power mode in the local storage.
     * @param lowPowerMode New value to update in the local storage.
     */

    public setLowPowerMode(lowPowerMode: boolean): void {
        this.data.settings.lowPowerMode = lowPowerMode;

        this.save();
    }

    /**
     * Updates the debug value in the local storage.
     * @param debug New value of the debug.
     */

    public setDebug(debug: boolean): void {
        this.data.settings.debugMode = debug;

        this.save();
    }

    /**
     * Updates whether or not to show names in the local storage.
     * @param showNames New value to write to the local storage.
     */

    public setShowNames(showNames: boolean): void {
        this.data.settings.showNames = showNames;

        this.save();
    }

    /**
     * Updates whether or not to display levels.
     * @param showLevels New value we are updating in the local storage.
     */

    public setShowLevels(showLevels: boolean): void {
        this.data.settings.showLevels = showLevels;

        this.save();
    }

    /**
     * Disables or enables region caching. Primarily for debugging.
     * @param disableCaching The value of the disable caching toggle switch.
     */

    public setDisableCaching(disableCaching: boolean): void {
        this.data.settings.disableCaching = disableCaching;

        this.save();
    }

    /**
     * Checks if the local storage version of the client
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
     * Updates the zoom factor in the local storage.
     * @param zoom New zoom factor we are saving.
     */

    public setZoom(zoom: number): void {
        this.data.player.zoom = zoom;

        this.save();
    }

    /**
     * Saves the objects and cursor tiles into the first index of their respective
     * object store within the IndexedDB database.
     * @param objects The object tileIds.
     * @param cursorTiles The cursor tileIds.
     */

    public setMapData(objects: number[], cursorTiles: CursorTiles): void {
        if (!this.mapData) return;

        let transaction = this.mapData.transaction(['objects', 'cursorTiles'], 'readwrite'),
            objectStore = transaction.objectStore('objects'),
            cursorStore = transaction.objectStore('cursorTiles');

        // Save them at index 0.
        objectStore.put(objects, 0);
        cursorStore.put(cursorTiles, 0);
    }

    /**
     * Stores the region data at the specified region id as the key within
     * the IndexedDB database. Each region is stored as an array of RegionTileData.
     * @param data Contains an array of information about each tile in the region.
     * @param region The region id we are saving.
     */

    public setRegionData(data: RegionTileData[], region: number): void {
        if (!this.mapData) return;

        let objectStore = this.mapData.transaction('regions', 'readwrite').objectStore('regions'),
            request = objectStore.get(region);

        request.addEventListener('success', () => {
            if (request.result) return;

            objectStore.put(data, region);
        });
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
     * Converts the game version string into a number.
     * @returns The current version to be used in the IndexedDB database.
     */

    public getDBVersion(): number {
        return parseInt(this.data.clientVersion.replace(/\D/g, '')) || 1;
    }

    /**
     * Whether or not the remember me toggle is on.
     * @returns Boolean value of the remember me toggle.
     */

    public hasRemember(): boolean {
        return this.data.player.rememberMe;
    }

    /**
     * @returns Whether or not the new variable is set to true in the storage.
     */

    public isNew(): boolean {
        return this.data.new;
    }

    /**
     * Grabs the local storage data of the map.
     * @returns RegionMapData object containing all the data stored so far.
     */

    public getRegionData(callback: (data: RegionMapData) => void): void {
        let info: RegionMapData = {
            regionData: {},
            objects: [],
            cursorTiles: {}
        };

        if (!this.mapData) return callback(info);

        // Create the transaction and begin grabbing data from each object store.
        let transaction = this.mapData.transaction(
                ['regions', 'objects', 'cursorTiles'],
                'readonly'
            ),
            regionRequest = transaction.objectStore('regions').openCursor(), // Grab all the indexes and the keys.
            objectRequest = transaction.objectStore('objects').get(0), // Only need the first index.
            cursorRequest = transaction.objectStore('cursorTiles').get(0); // Only need the first index.

        transaction.addEventListener('error', () => callback(info));

        regionRequest.addEventListener('success', (event: Event) => {
            let cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

            // Cursor is the currently processed index and key.
            if (cursor) {
                info.regionData[cursor.primaryKey as number] = cursor.value;
                cursor.continue();
            }
        });
        objectRequest.addEventListener('success', () => (info.objects = objectRequest.result));
        cursorRequest.addEventListener('success', () => (info.cursorTiles = cursorRequest.result));

        transaction.addEventListener('complete', () => callback(info));
    }

    /**
     * @returns The settings values stored.
     */

    public getSettings(): Settings {
        return this.data.settings;
    }

    /**
     * @returns The debug value stored in the local storage.
     */

    public getDebug(): boolean {
        return this.data.settings.debugMode;
    }
}
