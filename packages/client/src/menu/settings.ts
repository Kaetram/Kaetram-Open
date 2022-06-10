import Menu from './menu';
import Game from '../game';

export default class Settings extends Menu {
    private volumeSlider: HTMLInputElement = document.querySelector('#volume')!;
    private sfxSlider: HTMLInputElement = document.querySelector('#sfc')!;
    private brightnessSlider: HTMLInputElement = document.querySelector('#brightness')!;

    private soundCheckbox: HTMLInputElement = document.querySelector('#sound-check > .checkbox')!;
    private cameraCheckbox: HTMLInputElement = document.querySelector('#camera-check > .checkbox')!;
    private debugCheckbox: HTMLInputElement = document.querySelector('#debug-check > .checkbox')!;
    private centreCheckbox: HTMLInputElement = document.querySelector('#centre-check > .checkbox')!;
    private nameCheckbox: HTMLInputElement = document.querySelector('#name-check > .checkbox')!;
    private levelCheckbox: HTMLInputElement = document.querySelector('#level-check > .checkbox')!;

    public constructor(private game: Game) {
        super('#settings-page', undefined, '#settings-button');

        this.volumeSlider.addEventListener('input', this.handleVolume.bind(this));
        this.sfxSlider.addEventListener('input', this.handleSFX.bind(this));
        this.brightnessSlider.addEventListener('input', this.handleBrightness.bind(this));
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
}
