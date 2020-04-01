import $ from 'jquery';

import Audio from '../../../controllers/audio';
import Game from '../../../game';
import Camera from '../../../renderer/camera';
import Renderer from '../../../renderer/renderer';
import LocalStorage from '../../../utils/storage';

// TODO: Hide crypto mining option on mobiles and completely disable it.

export default class Settings {
    audio: Audio;
    storage: LocalStorage;
    renderer: Renderer;
    camera: Camera;
    body: JQuery<HTMLElement>;
    button: JQuery<HTMLElement>;
    volume: JQuery<HTMLElement>;
    sfx: JQuery<HTMLElement>;
    brightness: JQuery<HTMLElement>;
    info: JQuery<HTMLElement>;
    soundCheck: JQuery<HTMLElement>;
    cameraCheck: JQuery<HTMLElement>;
    debugCheck: JQuery<HTMLElement>;
    centreCheck: JQuery<HTMLElement>;
    nameCheck: JQuery<HTMLElement>;
    levelCheck: JQuery<HTMLElement>;
    loaded: boolean;
    value: number;

    constructor(public game: Game) {
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
        if (this.loaded) return;

        this.volume.val(this.getMusicLevel());
        this.sfx.val(this.getSFXLevel());
        this.brightness.val(this.getBrightness());

        this.game.app.updateRange(this.volume);
        this.game.app.updateRange(this.sfx);
        this.game.app.updateRange(this.brightness);

        this.renderer.adjustBrightness(this.getBrightness());

        this.button.click(() => {
            this.open();
        });

        this.volume.on('input', () => {
            if (this.audio.song) this.audio.song.volume = this.value / 100;
        });

        this.brightness.on('input', () => {
            this.renderer.adjustBrightness(this.value);
        });

        this.volume.change(() => {
            this.setMusicLevel(this.value);
        });

        this.sfx.change(() => {
            this.setSFXLevel(this.value);
        });

        this.brightness.change(() => {
            this.setBrightness(this.value);
        });

        this.soundCheck.click(() => {
            const isActive = this.soundCheck.hasClass('active');

            this.setSound(!isActive);

            if (isActive) {
                this.audio.reset(this.audio.song);
                this.audio.song = null;

                this.soundCheck.removeClass('active');
            } else {
                this.audio.update();

                this.soundCheck.addClass('active');
            }
        });

        this.cameraCheck.click(() => {
            const active = this.cameraCheck.hasClass('active');

            if (active) this.renderer.camera.decenter();
            else this.renderer.camera.center();

            this.cameraCheck.toggleClass('active');

            this.setCamera(!active);
        });

        this.debugCheck.click(() => {
            const active = this.debugCheck.hasClass('active');

            this.debugCheck.toggleClass('active');

            this.renderer.debugging = !active;

            this.setDebug(!active);
        });

        this.centreCheck.click(() => {
            const active = this.centreCheck.hasClass('active');

            this.centreCheck.toggleClass('active');

            this.renderer.autoCentre = !active;

            this.setCentre(!active);
        });

        this.nameCheck.click(() => {
            const active = this.nameCheck.hasClass('active');

            this.nameCheck.toggleClass('active');

            this.renderer.drawNames = !active;

            this.setName(!active);
        });

        this.levelCheck.click(() => {
            const active = this.levelCheck.hasClass('active');

            this.levelCheck.toggleClass('active');

            this.renderer.drawLevels = !active;

            this.setName(!active);
        });

        if (this.getSound()) this.soundCheck.addClass('active');

        if (this.getCamera()) this.cameraCheck.addClass('active');
        else {
            this.camera.centered = false;
            this.renderer.verifyCentration();
        }

        if (this.getDebug()) {
            this.debugCheck.addClass('active');
            this.renderer.debugging = true;
        }

        if (this.getCentreCap()) this.centreCheck.addClass('active');

        if (this.getName()) this.nameCheck.addClass('active');
        else this.renderer.drawNames = false;

        if (this.getLevel()) this.levelCheck.addClass('active');
        else this.renderer.drawLevels = false;

        this.loaded = true;
    }

    open() {
        this.game.interface.hideAll();

        this.button.toggleClass('active');

        if (this.isVisible()) this.hide();
        else this.show();
    }

    show() {
        this.body.fadeIn('slow');
    }

    hide() {
        this.body.fadeOut('fast');
        this.button.removeClass('active');
    }

    clear() {
        this.button.unbind('click');
        this.soundCheck.unbind('click');
        this.cameraCheck.unbind('click');
        this.debugCheck.unbind('click');
        this.centreCheck.unbind('click');
        this.nameCheck.unbind('click');
        this.levelCheck.unbind('click');

        this.brightness.unbind('change');
        this.volume.unbind('change');
        this.sfx.unbind('change');
    }

    setMusicLevel(musicLevel) {
        this.storage.data.settings.music = musicLevel;
        this.storage.save();
    }

    setSFXLevel(sfxLevel) {
        this.storage.data.settings.sfx = sfxLevel;
        this.storage.save();
    }

    setBrightness(brightness) {
        this.storage.data.settings.brightness = brightness;
        this.storage.save();
    }

    setSound(state) {
        this.storage.data.settings.soundEnabled = state;
        this.storage.save();
    }

    setCamera(state) {
        this.storage.data.settings.centerCamera = state;
        this.storage.save();
    }

    setDebug(state) {
        this.storage.data.settings.debug = state;
        this.storage.save();
    }

    setCentre(state) {
        this.storage.data.settings.autoCentre = state;
        this.storage.save();
    }

    setName(state) {
        this.storage.data.settings.showNames = state;
        this.storage.save();
    }

    setLevel(state) {
        this.storage.data.settings.showLevels = state;
        this.storage.save();
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
