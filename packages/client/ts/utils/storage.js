const storage = window.localStorage;
const name = 'data';
import Modules from './modules';

export default class Storage {
    constructor(app) {
        var self = this;

        self.app = app;
        self.data = null;

        self.load();
    }

    load() {
        var self = this;

        if (storage.data) self.data = JSON.parse(storage.getItem(name));
        else self.data = self.create();

        if (self.data.clientVersion !== self.app.config.version) {
            self.data = self.create();
            self.save();
        }
    }

    create() {
        return {
            new: true,
            clientVersion: this.app.config.version,

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

    save() {
        if (this.data) storage.setItem(name, JSON.stringify(this.data));
    }

    clear() {
        storage.removeItem(name);
        this.data = this.create();
    }

    toggleRemember(toggle) {
        var self = this;

        self.data.player.rememberMe = toggle;
        self.save();
    }

    setOrientation(orientation) {
        var self = this,
            player = self.getPlayer();

        player.orientation = orientation;

        self.save();
    }

    setPlayer(option, value) {
        var self = this,
            pData = self.getPlayer();

        if (pData.hasOwnProperty(option)) pData[option] = value;

        self.save();
    }

    setSettings(option, value) {
        var self = this,
            sData = self.getSettings();

        if (sData.hasOwnProperty(option)) sData[option] = value;

        self.save();
    }

    setRegionData(regionData, collisionData, objects, cursorTiles) {
        var self = this;

        self.data.map.regionData = regionData;
        self.data.map.collisions = collisionData;
        self.data.map.objects = objects;
        self.data.map.cursorTiles = cursorTiles;

        self.save();
    }

    getPlayer() {
        return this.data.player;
    }

    getSettings() {
        return this.data ? this.data.settings : null;
    }

    getRegionData() {
        return this.data.map.regionData;
    }

    getCollisions() {
        return this.data.map.collisions;
    }

    getObjects() {
        return this.data.map.objects;
    }

    getCursorTiles() {
        return this.data.map.cursorTiles;
    }
}
