define(function() {
    var storage = window.localStorage,
        name = 'data';

    return Class.extend({

        init: function(app) {
            var self = this;

            self.app = app;
            self.data = null;

            self.load();
        },

        load: function() {
            var self = this;

            if (storage.data)
                self.data = JSON.parse(storage.getItem(name));
            else
                self.data = self.create();

            if (self.data.clientVersion !== self.app.config.version) {
                self.data = self.create();
                self.save();
            }
        },

        create: function() {
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
                }
            };
        },

        save: function() {
            if (this.data)
                storage.setItem(name, JSON.stringify(this.data));
        },

        clear: function() {
            storage.removeItem(name);
            this.data = this.create();
        },

        toggleRemember: function(toggle) {
            var self = this;

            self.data.player.rememberMe = toggle;
            self.save();
        },

        setOrientation: function(orientation) {
            var self = this,
                player = self.getPlayer();

            player.orientation = orientation;

            self.save();
        },

        setPlayer: function(option, value) {
            var self = this,
                pData = self.getPlayer();

            if (pData.hasOwnProperty(option))
                pData[option] = value;

            self.save();
        },

        setSettings: function(option, value) {
            var self = this,
                sData = self.getSettings();

            if (sData.hasOwnProperty(option))
                sData[option] = value;

            self.save();
        },

        getPlayer: function() {
            return this.data.player;
        },

        getSettings: function() {
            return this.data ? this.data.settings : null;
        }

    });
});
