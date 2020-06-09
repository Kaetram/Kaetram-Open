import $ from 'jquery';
import _ from 'underscore';

export default class Settings {
    //TODO - Hide crpyto mining option on mobiles and completely disable it.
    constructor(game) {
        this.game = game;
        this.audio = game.audio;
        this.storage = game.storage;
        this.renderer = game.renderer;
        this.camera = game.renderer.camera;

        this.body = $('#settingsPage');
        this.button = $('#settingsButton');

        this.volume = $('#volume');
        this.sfx = $('#sfx');
        this.brightness = $('#brightness');

        this.info = $('#info');

        this.soundCheck = $('#soundCheck');
        this.cameraCheck = $('#cameraCheck');
        this.debugCheck = $('#debugCheck');
        this.centreCheck = $('#centreCheck');
        this.nameCheck = $('#nameCheck');
        this.levelCheck = $('#levelCheck');

        this.loaded = false;

        this.load();
    }

    load() {
        var self = this;

        if (self.loaded) return;

        self.volume.val(self.getMusicLevel());
        self.sfx.val(self.getSFXLevel());
        self.brightness.val(self.getBrightness());

        self.game.app.updateRange(self.volume);
        self.game.app.updateRange(self.sfx);
        self.game.app.updateRange(self.brightness);

        self.renderer.adjustBrightness(self.getBrightness());

        self.button.click(function () {
            self.open();
        });

        self.volume.on('input', function () {
            if (self.audio.song) self.audio.song.volume = this.value / 100;
        });

        self.brightness.on('input', function () {
            self.renderer.adjustBrightness(this.value);
        });

        self.volume.change(function () {
            self.setMusicLevel(this.value);
        });

        self.sfx.change(function () {
            self.setSFXLevel(this.value);
        });

        self.brightness.change(function () {
            self.setBrightness(this.value);
        });

        self.soundCheck.click(function () {
            var isActive = self.soundCheck.hasClass('active');

            self.setSound(!isActive);

            if (isActive) {
                self.audio.reset(self.audio.song);
                self.audio.song = null;

                self.soundCheck.removeClass('active');
            } else {
                self.audio.update();

                self.soundCheck.addClass('active');
            }
        });

        self.cameraCheck.click(function () {
            var active = self.cameraCheck.hasClass('active');

            if (active) self.renderer.camera.decenter();
            else self.renderer.camera.center();

            self.cameraCheck.toggleClass('active');

            self.setCamera(!active);
        });

        self.debugCheck.click(function () {
            var active = self.debugCheck.hasClass('active');

            self.debugCheck.toggleClass('active');

            self.renderer.debugging = !active;

            self.setDebug(!active);
        });

        self.centreCheck.click(function () {
            var active = self.centreCheck.hasClass('active');

            self.centreCheck.toggleClass('active');

            self.renderer.autoCentre = !active;

            self.setCentre(!active);
        });

        self.nameCheck.click(function () {
            var active = self.nameCheck.hasClass('active');

            self.nameCheck.toggleClass('active');

            self.renderer.drawNames = !active;

            self.setName(!active);
        });

        self.levelCheck.click(function () {
            var active = self.levelCheck.hasClass('active');

            self.levelCheck.toggleClass('active');

            self.renderer.drawLevels = !active;

            self.setName(!active);
        });

        if (self.getSound()) self.soundCheck.addClass('active');

        if (self.getCamera()) self.cameraCheck.addClass('active');
        else {
            self.camera.centered = false;
            self.renderer.verifyCentration();
        }

        if (self.getDebug()) {
            self.debugCheck.addClass('active');
            self.renderer.debugging = true;
        }

        if (self.getCentreCap()) self.centreCheck.addClass('active');

        if (self.getName()) self.nameCheck.addClass('active');
        else self.renderer.drawNames = false;

        if (self.getLevel()) self.levelCheck.addClass('active');
        else self.renderer.drawLevels = false;

        self.loaded = true;
    }

    open() {
        var self = this;

        self.game.interface.hideAll();

        self.button.toggleClass('active');

        if (self.isVisible()) self.hide();
        else self.show();
    }

    show() {
        this.body.fadeIn('slow');
    }

    hide() {
        var self = this;

        self.body.fadeOut('fast');
        self.button.removeClass('active');
    }

    clear() {
        var self = this;

        self.button.unbind('click');
        self.soundCheck.unbind('click');
        self.cameraCheck.unbind('click');
        self.debugCheck.unbind('click');
        self.centreCheck.unbind('click');
        self.nameCheck.unbind('click');
        self.levelCheck.unbind('click');

        self.brightness.unbind('change');
        self.volume.unbind('change');
        self.sfx.unbind('change');
    }

    setMusicLevel(musicLevel) {
        var self = this;

        self.storage.data.settings.music = musicLevel;
        self.storage.save();
    }

    setSFXLevel(sfxLevel) {
        var self = this;

        self.storage.data.settings.sfx = sfxLevel;
        self.storage.save();
    }

    setBrightness(brightness) {
        var self = this;

        self.storage.data.settings.brightness = brightness;
        self.storage.save();
    }

    setSound(state) {
        var self = this;

        self.storage.data.settings.soundEnabled = state;
        self.storage.save();
    }

    setCamera(state) {
        var self = this;

        self.storage.data.settings.centerCamera = state;
        self.storage.save();
    }

    setDebug(state) {
        var self = this;

        self.storage.data.settings.debug = state;
        self.storage.save();
    }

    setCentre(state) {
        var self = this;

        self.storage.data.settings.autoCentre = state;
        self.storage.save();
    }

    setName(state) {
        var self = this;

        self.storage.data.settings.showNames = state;
        self.storage.save();
    }

    setLevel(state) {
        var self = this;

        self.storage.data.settings.showLevels = state;
        self.storage.save();
    }

    getMusicLevel() {
        return this.storage.data.settings.music;
    }

    getSFXLevel() {
        return this.storage.data.settings.sfx;
    }

    getBrightness() {
        return this.storage.data.settings.brightness;
    }

    getSound() {
        return this.storage.data.settings.soundEnabled;
    }

    getCamera() {
        return this.storage.data.settings.centerCamera;
    }

    getDebug() {
        return this.storage.data.settings.debug;
    }

    getCentreCap() {
        return this.storage.data.settings.autoCentre;
    }

    getName() {
        return this.storage.data.settings.showNames;
    }

    getLevel() {
        return this.storage.data.settings.showLevels;
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }
}
