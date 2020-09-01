import $ from 'jquery';
import Game from '../../../game';
import AudioController from '../../../controllers/audio';
import Storage from '../../../utils/storage';
import Renderer from '../../../renderer/renderer';
import Camera from '../../../renderer/camera';

export default class Settings {
    game: Game;
    audio: AudioController;
    storage: Storage;
    renderer: Renderer;
    camera: Camera;
    body: JQuery;
    button: JQuery;
    volume: JQuery<HTMLInputElement>;
    sfx: JQuery<HTMLInputElement>;
    brightness: JQuery<HTMLInputElement>;
    info: JQuery;
    soundCheck: JQuery;
    cameraCheck: JQuery;
    debugCheck: JQuery;
    centreCheck: JQuery;
    nameCheck: JQuery;
    levelCheck: JQuery;
    loaded: boolean;
    value: number;

    //TODO - Hide crpyto mining option on mobiles and completely disable it.
    constructor(game: Game) {
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

    load(): void {
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

    open(): void {
        this.game.menu.hideAll();

        this.button.toggleClass('active');

        if (this.isVisible()) this.hide();
        else this.show();
    }

    show(): void {
        this.body.fadeIn('slow');
    }

    hide(): void {
        this.body.fadeOut('fast');
        this.button.removeClass('active');
    }

    clear(): void {
        this.button.off('click');
        this.soundCheck.off('click');
        this.cameraCheck.off('click');
        this.debugCheck.off('click');
        this.centreCheck.off('click');
        this.nameCheck.off('click');
        this.levelCheck.off('click');

        this.brightness.off('change');
        this.volume.off('change');
        this.sfx.off('change');
    }

    setMusicLevel(musicLevel: number): void {
        this.storage.data.settings.music = musicLevel;
        this.storage.save();
    }

    setSFXLevel(sfxLevel: number): void {
        this.storage.data.settings.sfx = sfxLevel;
        this.storage.save();
    }

    setBrightness(brightness: number): void {
        this.storage.data.settings.brightness = brightness;
        this.storage.save();
    }

    setSound(state: boolean): void {
        this.storage.data.settings.soundEnabled = state;
        this.storage.save();
    }

    setCamera(state: boolean): void {
        this.storage.data.settings.centerCamera = state;
        this.storage.save();
    }

    setDebug(state: boolean): void {
        this.storage.data.settings.debug = state;
        this.storage.save();
    }

    setCentre(state: boolean): void {
        this.storage.data.settings.autoCentre = state;
        this.storage.save();
    }

    setName(state: boolean): void {
        this.storage.data.settings.showNames = state;
        this.storage.save();
    }

    setLevel(state: boolean): void {
        this.storage.data.settings.showLevels = state;
        this.storage.save();
    }

    getMusicLevel(): number {
        return this.storage.data.settings.music;
    }

    getSFXLevel(): number {
        return this.storage.data.settings.sfx;
    }

    getBrightness(): number {
        return this.storage.data.settings.brightness;
    }

    getSound(): boolean {
        return this.storage.data.settings.soundEnabled;
    }

    getCamera(): boolean {
        return this.storage.data.settings.centerCamera;
    }

    getDebug(): boolean {
        return this.storage.data.settings.debug;
    }

    getCentreCap(): boolean {
        return this.storage.data.settings.autoCentre;
    }

    getName(): boolean {
        return this.storage.data.settings.showNames;
    }

    getLevel(): boolean {
        return this.storage.data.settings.showLevels;
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
