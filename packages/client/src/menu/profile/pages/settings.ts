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

        const {
            volume,
            sfx,
            brightness,
            game,
            renderer,
            button,
            soundCheck,
            audio,
            cameraCheck,
            debugCheck,
            centreCheck,
            nameCheck,
            levelCheck
        } = this;

        volume.val(this.getMusicLevel());
        sfx.val(this.getSFXLevel());
        brightness.val(this.getBrightness());

        game.app.updateRange(volume);
        game.app.updateRange(sfx);
        game.app.updateRange(brightness);

        renderer.adjustBrightness(this.getBrightness());

        button.on('click', () => this.open());

        volume.on('input', () => this.setMusicLevel(volume.val() as number));

        sfx.on('input', () => this.setSFXLevel(sfx.val() as number));

        brightness.on('input', () => this.setBrightness(brightness.val() as number));

        soundCheck.on('input', () => {
            const isActive = soundCheck.prop('checked');

            this.setSound(isActive);

            if (isActive) {
                audio.reset(audio.song);
                audio.song = null;
            } else audio.update();
        });

        cameraCheck.on('input', () => {
            const active = cameraCheck.prop('checked');

            if (active) renderer.camera.center();
            else renderer.camera.decenter();

            this.setCamera(active);
        });

        debugCheck.on('input', () => {
            const active = debugCheck.prop('checked');

            renderer.debugging = active;

            this.setDebug(active);
        });

        centreCheck.on('input', () => {
            const active = centreCheck.prop('checked');

            renderer.autoCentre = active;

            this.setCentre(active);
        });

        nameCheck.on('input', () => {
            const active = nameCheck.prop('checked');

            renderer.drawNames = active;

            this.setName(active);
        });

        levelCheck.on('input', () => {
            const active = levelCheck.prop('checked');

            renderer.drawLevels = active;

            this.setName(active);
        });

        soundCheck.prop('checked', this.getSound());

        cameraCheck.prop('checked', this.getCamera());

        debugCheck.prop('checked', this.getDebug());

        centreCheck.prop('checked', this.getCentreCap());

        nameCheck.prop('checked', this.getName());

        levelCheck.prop('checked', this.getLevel());

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
        this.soundCheck.off('input');
        this.cameraCheck.off('input');
        this.debugCheck.off('input');
        this.centreCheck.off('input');
        this.nameCheck.off('input');
        this.levelCheck.off('input');

        this.brightness.off('input');
        this.volume.off('input');
        this.sfx.off('input');
    }

    setMusicLevel(musicLevel: number): void {
        const { audio, storage } = this;

        if (audio.song) audio.song.volume = musicLevel / 100;

        storage.data.settings.music = musicLevel;
        storage.save();
    }

    setSFXLevel(sfxLevel: number): void {
        this.storage.data.settings.sfx = sfxLevel;
        this.storage.save();
    }

    setBrightness(brightness: number): void {
        this.renderer.adjustBrightness(brightness);

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
