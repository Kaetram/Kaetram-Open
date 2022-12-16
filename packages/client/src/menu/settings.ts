import Menu from './menu';

import type Game from '../game';

export default class Settings extends Menu {
    private musicSlider: HTMLInputElement = document.querySelector('#music')!;
    private soundSlider: HTMLInputElement = document.querySelector('#sound')!;
    private brightnessSlider: HTMLInputElement = document.querySelector('#brightness')!;

    private audioEnabledCheckbox: HTMLInputElement = document.querySelector(
        '#audio-enabled-checkbox > input'
    )!;
    private lowPowerCheckbox: HTMLInputElement = document.querySelector(
        '#low-power-checkbox > input'
    )!;
    private debugCheckbox: HTMLInputElement = document.querySelector(
        '#debug-mode-checkbox > input'
    )!;
    private showNamesCheckbox: HTMLInputElement = document.querySelector(
        '#show-names-checkbox > input'
    )!;
    private showLevelsCheckbox: HTMLInputElement = document.querySelector(
        '#show-levels-checkbox > input'
    )!;
    private disableCachingCheckbox: HTMLInputElement = document.querySelector(
        '#disable-region-caching-checkbox > input'
    )!;

    public constructor(private game: Game) {
        super('#settings-page', undefined, '#settings-button');

        this.musicSlider.addEventListener('input', this.handleMusic.bind(this));
        this.soundSlider.addEventListener('input', this.handleSoundVolume.bind(this));
        this.brightnessSlider.addEventListener('input', this.handleBrightness.bind(this));

        this.audioEnabledCheckbox.addEventListener('change', this.handleAudioEnabled.bind(this));
        this.lowPowerCheckbox.addEventListener('change', this.handleLowPower.bind(this));
        this.debugCheckbox.addEventListener('change', this.handleDebug.bind(this));
        this.showNamesCheckbox.addEventListener('change', this.handleName.bind(this));
        this.showLevelsCheckbox.addEventListener('change', this.handleLevel.bind(this));
        this.disableCachingCheckbox.addEventListener('change', this.handleCaching.bind(this));

        this.load();
    }

    /**
     * Loads all the information about the sliders and checkboxes from the local storage.
     * We call all the handler functions here to ensure that the associated functions are
     * called without having them import the settings page and create a spaghetti code situation.
     * The settings page lives independently of the game and calls functions as needed.
     */

    private load(): void {
        let settings = this.game.storage.getSettings();

        this.musicSlider.value = settings.musicVolume?.toString();
        this.soundSlider.value = settings.soundVolume?.toString();
        this.brightnessSlider.value = settings.brightness?.toString();

        this.audioEnabledCheckbox.checked = settings.audioEnabled;
        this.lowPowerCheckbox.checked = settings.lowPowerMode;
        this.debugCheckbox.checked = settings.debugMode;
        this.showNamesCheckbox.checked = settings.showNames;
        this.showLevelsCheckbox.checked = settings.showLevels;
        this.disableCachingCheckbox.checked = settings.disableCaching;

        // Update brightness value.
        this.handleBrightness();

        // Update debugging
        this.handleDebug();

        // Update camera once loaded.
        this.handleLowPower();

        // Update the renderer for names and levels
        this.handleName();
        this.handleLevel();
    }

    /**
     * Handler for when the music input slider changes, sets the value into the local storage.
     */

    private handleMusic(): void {
        this.game.storage.setMusicVolume(this.musicSlider.valueAsNumber);
        this.game.audio.updateVolume();
    }

    /**
     * Handler for when the Sound slider changes, updates the value in the local storage.
     */

    private handleSoundVolume(): void {
        this.game.storage.setSoundVolume(this.soundSlider.valueAsNumber);
    }

    /**
     * Handler for the brightness slider when it undergoes a change. Relays
     * to both the renderer and the storage system that an update has commenced.
     */

    private handleBrightness(): void {
        this.game.storage.setBrightness(this.brightnessSlider.valueAsNumber);
        this.game.renderer.setBrightness(this.brightnessSlider.valueAsNumber);
    }

    /**
     * Handler for when the sound checkbox is toggled.
     */

    private handleAudioEnabled(): void {
        this.game.storage.setAudioEnabled(this.audioEnabledCheckbox.checked);
        this.game.audio.updateVolume();
    }

    /**
     * Handler for when the low power checkbox is toggled.
     */

    private handleLowPower(): void {
        this.game.storage.setLowPowerMode(this.lowPowerCheckbox.checked);

        this.game.renderer.animateTiles = !this.lowPowerCheckbox.checked;

        if (this.lowPowerCheckbox.checked) this.game.camera.decenter();
        else {
            // Force camera to recenter on the player.
            this.game.camera.center();
            this.game.camera.centreOn(this.game.player);
            this.game.renderer.updateAnimatedTiles();
        } // Remove the camera from the player.
    }

    /**
     * Handler for when the debug checkbox is toggled.
     */

    private handleDebug(): void {
        this.game.storage.setDebug(this.debugCheckbox.checked);
        this.game.renderer.debugging = this.debugCheckbox.checked;
    }

    /**
     * Handler for when the name checkbox is toggled.
     */

    private handleName(): void {
        this.game.storage.setShowNames(this.showNamesCheckbox.checked);
        this.game.renderer.drawNames = this.showNamesCheckbox.checked;
    }

    /**
     * Handler for when the level checkbox is toggled.
     */

    private handleLevel(): void {
        this.game.storage.setShowLevels(this.showLevelsCheckbox.checked);
        this.game.renderer.drawLevels = this.showLevelsCheckbox.checked;
    }

    /**
     * Disables the region caching checkbox.
     */

    private handleCaching(): void {
        this.game.storage.setDisableCaching(this.disableCachingCheckbox.checked);
    }
}
