import $ from 'jquery';

import AudioController from '../../../controllers/audio';
import Game from '../../../game';
import Camera from '../../../renderer/camera';
import Renderer from '../../../renderer/renderer';
import Storage from '../../../utils/storage';

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
    soundCheck: JQuery<HTMLInputElement>;
    cameraCheck: JQuery<HTMLInputElement>;
    debugCheck: JQuery<HTMLInputElement>;
    centreCheck: JQuery<HTMLInputElement>;
    nameCheck: JQuery<HTMLInputElement>;
    levelCheck: JQuery<HTMLInputElement>;
    loaded: boolean;
    value!: number;

    // TODO - Hide crypto mining option on mobiles and completely disable it.
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

        this.soundCheck = $('#soundCheck input');
        this.cameraCheck = $('#cameraCheck input');
        this.debugCheck = $('#debugCheck input');
        this.centreCheck = $('#centreCheck input');
        this.nameCheck = $('#nameCheck input');
        this.levelCheck = $('#levelCheck input');

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

        this.button.on('click', () => this.open());

        this.volume.on('input', () => {
            if (this.audio.song) this.audio.song.volume = this.value / 100;
        });

        this.brightness.on('input', () => this.renderer.adjustBrightness(this.value));

        this.volume.on('change', () => this.setMusicLevel(this.value));

        this.sfx.on('change', () => this.setSFXLevel(this.value));

        this.brightness.on('change', () => this.setBrightness(this.value));

        this.soundCheck.on('change', () => {
            const isActive = this.soundCheck.prop('checked');

            this.setSound(!isActive);

            if (isActive) {
                this.audio.reset(this.audio.song);
                this.audio.song = null;
            } else this.audio.update();
        });

        this.cameraCheck.on('change', () => {
            const active = this.cameraCheck.prop('checked');

            if (active) this.renderer.camera.center();
            else this.renderer.camera.decenter();

            this.setCamera(active);
        });

        this.debugCheck.on('change', () => {
            const active = this.debugCheck.prop('checked');

            this.renderer.debugging = active;

            this.setDebug(active);
        });

        this.centreCheck.on('change', () => {
            const active = this.centreCheck.prop('checked');

            this.renderer.autoCentre = active;

            this.setCentre(active);
        });

        this.nameCheck.on('change', () => {
            const active = this.nameCheck.prop('checked');

            this.renderer.drawNames = active;

            this.setName(active);
        });

        this.levelCheck.on('change', () => {
            const active = this.levelCheck.prop('checked');

            this.renderer.drawLevels = active;

            this.setName(active);
        });

        this.soundCheck.prop('checked', this.getSound());

        this.cameraCheck.prop('checked', this.getCamera());

        this.debugCheck.prop('checked', this.getDebug());

        this.centreCheck.prop('checked', this.getCentreCap());

        this.nameCheck.prop('checked', this.getName());

        this.levelCheck.prop('checked', this.getLevel());

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
        this.soundCheck.off('change');
        this.cameraCheck.off('change');
        this.debugCheck.off('change');
        this.centreCheck.off('change');
        this.nameCheck.off('change');
        this.levelCheck.off('change');

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
