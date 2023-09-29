import Menu from './menu';

import { isMobile, isMacintoshFirefox } from '../utils/detect';

import { Modules } from '@kaetram/common/network';

import type Game from '../game';

export default class Settings extends Menu {
    public override identifier: number = Modules.Interfaces.Settings;

    private musicSlider: HTMLInputElement = document.querySelector('#music')!;
    private soundSlider: HTMLInputElement = document.querySelector('#sound')!;
    private brightnessSlider: HTMLInputElement = document.querySelector('#brightness')!;

    private audioEnabledCheckbox: HTMLInputElement = document.querySelector(
        '#audio-enabled-checkbox > input'
    )!;
    private lowPowerCheckbox: HTMLInputElement = document.querySelector(
        '#low-power-checkbox > input'
    )!;
    private joystickEnabledCheckbox: HTMLInputElement = document.querySelector(
        '#joystick-enabled-checkbox > input'
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
    private webGlCheckbox: HTMLInputElement = document.querySelector('#webgl-checkbox > input')!;
    private fpsThrottleDropdown: HTMLSelectElement = document.querySelector(
        '#frame-throttle > select'
    )!;

    public constructor(private game: Game) {
        super('#settings-page', '#close-settings', '#settings-button');

        this.musicSlider.addEventListener('input', this.handleMusic.bind(this));
        this.soundSlider.addEventListener('input', this.handleSoundVolume.bind(this));
        this.brightnessSlider.addEventListener('input', this.handleBrightness.bind(this));

        this.audioEnabledCheckbox.addEventListener('change', this.handleAudioEnabled.bind(this));
        this.lowPowerCheckbox.addEventListener('change', this.handleLowPower.bind(this));
        this.joystickEnabledCheckbox.addEventListener(
            'change',
            this.handleJoystickEnabled.bind(this)
        );
        this.debugCheckbox.addEventListener('change', this.handleDebug.bind(this));
        this.showNamesCheckbox.addEventListener('change', this.handleName.bind(this));
        this.showLevelsCheckbox.addEventListener('change', this.handleLevel.bind(this));
        this.disableCachingCheckbox.addEventListener('change', this.handleCaching.bind(this));
        this.webGlCheckbox.addEventListener('change', this.handleWebGl.bind(this));
        this.fpsThrottleDropdown.addEventListener('change', this.handleFpsThrottle.bind(this));

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
        this.joystickEnabledCheckbox.checked = settings.joyStickEnabled;
        this.debugCheckbox.checked = settings.debugMode;
        this.showNamesCheckbox.checked = settings.showNames;
        this.showLevelsCheckbox.checked = settings.showLevels;
        this.disableCachingCheckbox.checked = settings.disableCaching;
        this.webGlCheckbox.checked = settings.webgl;
        this.fpsThrottleDropdown.selectedIndex = settings.fpsThrottle;

        // Hide webgl checkbox if not supported.
        if (isMacintoshFirefox()) this.hideWebGlOption();

        // Hide the debug option if not on desktop.
        if (import.meta.env.PROD || isMobile()) this.hideDebugOption();

        // Update brightness value.
        this.handleBrightness();

        // Update debugging
        this.handleDebug();

        // Update camera once loaded.
        this.handleLowPower();

        // Update joystick once loaded.
        this.handleJoystickEnabled();

        // Update the renderer for names and levels
        this.handleName();
        this.handleLevel();

        this.handleInfo();
        this.handleFpsThrottle();
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
        } // Remove the camera from the player.
    }

    /**
     * Handler for when the joystick checkbox is toggled.
     */

    private handleJoystickEnabled(): void {
        if (isMobile()) {
            this.game.storage.setJoyStickEnabled(this.joystickEnabledCheckbox.checked);

            if (this.joystickEnabledCheckbox.checked) this.game.joystick.show();
            else this.game.joystick.hide();
        } else document.querySelector<HTMLElement>('#joystick-enabled-checkbox')!.hidden = true;
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

    /**
     * Handles swapping between the WebGL and Canvas2D rendering engines.
     */

    private handleWebGl(): void {
        this.game.storage.setWebGl(this.webGlCheckbox.checked);

        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    /**
     * Handles updating of the FPS throttle from the drop down menu.
     * @param value
     */

    private handleFpsThrottle(): void {
        let index = this.fpsThrottleDropdown.selectedIndex;

        this.game.storage.setFpsThrottle(index);

        let isEnabled = index !== 0;

        // Enable or disable the throttle based on the index selected.
        this.game.throttle = isEnabled;

        // Apply the FPS throttling to the game tick.
        if (index === 1) this.game.targetFPS = 1000 / 50;
        else if (index === 2) this.game.targetFPS = 1000 / 30;
    }

    /**
     * Handles the information section of the settings page.
     */

    private handleInfo() {
        let { config } = this.game.app;
        document.querySelector(
            '#game-info-version'
        )!.textContent = `${config.version}${config.minor}`;

        let { serverId } = this.game.player;
        document.querySelector('#game-info-world')!.textContent =
            serverId === -1 ? 'Unknown' : serverId.toString();
    }

    /**
     * Some browsers (specifically Firefox) don't play well with WebGL resizing. Since I've
     * already spent so much time trying to figure out why it doesn't work, I'm just going
     * to hide the option for now.
     */

    private hideWebGlOption(): void {
        let checkbox = document.querySelector<HTMLElement>('#webgl-checkbox')!;

        checkbox.style.display = 'none';
    }

    /**
     * Hides the debug mode checkbox when the game is not in debug mode.
     */

    private hideDebugOption(): void {
        let checkbox = document.querySelector<HTMLElement>('#debug-mode-checkbox')!;

        checkbox.style.display = 'none';
    }
}
