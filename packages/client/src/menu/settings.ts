import Menu from './menu';
import Game from '../game';

export default class Settings extends Menu {
    private volumeSlider: HTMLInputElement = document.querySelector('#volume')!;
    private sfxSlider: HTMLInputElement = document.querySelector('#sfx')!;
    private brightnessSlider: HTMLInputElement = document.querySelector('#brightness')!;

    private soundCheckbox: HTMLInputElement = document.querySelector('#sound-check > input')!;
    private lowPowerCheckbox: HTMLInputElement = document.querySelector(
        '#low-power-check > input'
    )!;
    private debugCheckbox: HTMLInputElement = document.querySelector('#debug-check > input')!;
    private nameCheckbox: HTMLInputElement = document.querySelector('#name-check > input')!;
    private levelCheckbox: HTMLInputElement = document.querySelector('#level-check > input')!;

    public constructor(private game: Game) {
        super('#settings-page', undefined, '#settings-button');

        this.volumeSlider.addEventListener('input', this.handleVolume.bind(this));
        this.sfxSlider.addEventListener('input', this.handleSFX.bind(this));
        this.brightnessSlider.addEventListener('input', this.handleBrightness.bind(this));

        this.soundCheckbox.addEventListener('change', this.handleSound.bind(this));
        this.lowPowerCheckbox.addEventListener('change', this.handleLowPower.bind(this));
        this.debugCheckbox.addEventListener('change', this.handleDebug.bind(this));
        this.nameCheckbox.addEventListener('change', this.handleName.bind(this));
        this.levelCheckbox.addEventListener('change', this.handleLevel.bind(this));

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

        this.volumeSlider.value = settings.music.toString();
        this.sfxSlider.value = settings.sfx.toString();
        this.brightnessSlider.value = settings.brightness.toString();

        this.soundCheckbox.checked = settings.soundEnabled;
        this.lowPowerCheckbox.checked = settings.lowPowerMode;
        this.debugCheckbox.checked = settings.debug;
        this.nameCheckbox.checked = settings.showNames;
        this.levelCheckbox.checked = settings.showLevels;

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
     * Handler for when the volume input slider changes, sets the value into the local storage.
     */

    private handleVolume(): void {
        this.game.storage.setVolume(this.volumeSlider.valueAsNumber);
    }

    /**
     * Handler for when the SFX slider changes, updates the value in the local storage.
     */

    private handleSFX(): void {
        this.game.storage.setSFX(this.sfxSlider.valueAsNumber);
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

    private handleSound(): void {
        this.game.storage.setSoundEnabled(this.soundCheckbox.checked);
    }

    /**
     * Handler for when the low power checkbox is toggled.
     */

    private handleLowPower(): void {
        this.game.storage.setLowPowerMode(this.lowPowerCheckbox.checked);

        this.game.renderer.animateTiles = !this.lowPowerCheckbox.checked;

        if (!this.lowPowerCheckbox.checked) {
            // Force camera to recenter on the player.
            this.game.camera.center();
            this.game.camera.centreOn(this.game.player);
            this.game.renderer.updateAnimatedTiles();
        } else this.game.camera.decenter(); // Remove the camera from the player.
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
        this.game.storage.setShowNames(this.nameCheckbox.checked);
        this.game.renderer.drawNames = this.nameCheckbox.checked;
    }

    /**
     * Handler for when the level checkbox is toggled.
     */

    private handleLevel(): void {
        this.game.storage.setShowLevels(this.levelCheckbox.checked);
        this.game.renderer.drawLevels = this.levelCheckbox.checked;
    }
}
