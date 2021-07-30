import $ from 'jquery';

import type Game from '../../../game';

export default class Settings {
    private audio;
    private storage;
    private renderer;

    private body = $('#settingsPage');
    private button = $('#settingsButton');

    private volume = $<HTMLInputElement>('#volume');
    private sfx = $<HTMLInputElement>('#sfx');
    private brightness = $<HTMLInputElement>('#brightness');

    // info = $('#info');

    private soundCheck = $<HTMLInputElement>('#soundCheck input');
    private cameraCheck = $<HTMLInputElement>('#cameraCheck input');
    private debugCheck = $<HTMLInputElement>('#debugCheck input');
    private centreCheck = $<HTMLInputElement>('#centreCheck input');
    private nameCheck = $<HTMLInputElement>('#nameCheck input');
    private levelCheck = $<HTMLInputElement>('#levelCheck input');

    private loaded = false;

    public constructor(private game: Game) {
        this.audio = game.audio;
        this.storage = game.storage;
        this.renderer = game.renderer;

        this.load();
    }

    private load(): void {
        if (this.loaded) return;

        let {
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
            let isActive = soundCheck.prop('checked');

            this.setSound(isActive);

            if (isActive) {
                audio.reset(audio.song);
                audio.song = null;
            } else audio.update();
        });

        cameraCheck.on('input', () => {
            let active = cameraCheck.prop('checked');

            if (active) renderer.camera.center();
            else renderer.camera.decenter();

            this.setCamera(active);
        });

        debugCheck.on('input', () => {
            let active = debugCheck.prop('checked');

            renderer.debugging = active;

            this.setDebug(active);
        });

        centreCheck.on('input', () => {
            let active = centreCheck.prop('checked');

            renderer.autoCentre = active;

            this.setCentre(active);
        });

        nameCheck.on('input', () => {
            let active = nameCheck.prop('checked');

            renderer.drawNames = active;

            this.setName(active);
        });

        levelCheck.on('input', () => {
            let active = levelCheck.prop('checked');

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

    private open(): void {
        this.game.menu.hideAll();

        this.button.toggleClass('active');

        if (this.isVisible()) this.hide();
        else this.show();
    }

    private show(): void {
        this.body.fadeIn('slow');
    }

    public hide(): void {
        this.body.fadeOut('fast');
        this.button.removeClass('active');
    }

    public clear(): void {
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

    private setMusicLevel(musicLevel: number): void {
        let { audio, storage } = this;

        if (audio.song) audio.song.volume = musicLevel / 100;

        storage.data.settings.music = musicLevel;
        storage.save();
    }

    private setSFXLevel(sfxLevel: number): void {
        this.storage.data.settings.sfx = sfxLevel;
        this.storage.save();
    }

    private setBrightness(brightness: number): void {
        this.renderer.adjustBrightness(brightness);

        this.storage.data.settings.brightness = brightness;
        this.storage.save();
    }

    private setSound(state: boolean): void {
        this.storage.data.settings.soundEnabled = state;
        this.storage.save();
    }

    private setCamera(state: boolean): void {
        this.storage.data.settings.centerCamera = state;
        this.storage.save();
    }

    private setDebug(state: boolean): void {
        this.storage.data.settings.debug = state;
        this.storage.save();
    }

    private setCentre(state: boolean): void {
        this.storage.data.settings.autoCentre = state;
        this.storage.save();
    }

    private setName(state: boolean): void {
        this.storage.data.settings.showNames = state;
        this.storage.save();
    }

    // setLevel(state: boolean): void {
    //     this.storage.data.settings.showLevels = state;
    //     this.storage.save();
    // }

    private getMusicLevel(): number {
        return this.storage.data.settings.music;
    }

    private getSFXLevel(): number {
        return this.storage.data.settings.sfx;
    }

    private getBrightness(): number {
        return this.storage.data.settings.brightness;
    }

    private getSound(): boolean {
        return this.storage.data.settings.soundEnabled;
    }

    private getCamera(): boolean {
        return this.storage.data.settings.centerCamera;
    }

    private getDebug(): boolean {
        return this.storage.data.settings.debug;
    }

    private getCentreCap(): boolean {
        return this.storage.data.settings.autoCentre;
    }

    private getName(): boolean {
        return this.storage.data.settings.showNames;
    }

    private getLevel(): boolean {
        return this.storage.data.settings.showLevels;
    }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
