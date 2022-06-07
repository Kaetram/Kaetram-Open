import log from '../lib/log';

export default class Overlay {
    private currentOverlay = '';

    private overlays: { [key: string]: HTMLImageElement } = {
        fog: this.load('fog')
    };

    /**
     * Loads an overlay based on the provided string.
     * @param name File name of the overlay.
     * @returns HTML image of the overlay if it exists.
     */

    private load(name: string): HTMLImageElement {
        let overlay = new Image(),
            image = `/img/overlays/${name}.png`;

        overlay.crossOrigin = 'Anonymous';
        overlay.src = image;

        overlay.addEventListener('load', () => log.debug(`Loaded ${name}`));

        return overlay;
    }

    /**
     * @returns Whether or not overlay exists by checking if the string is empty.
     */

    public hasOverlay(): boolean {
        return this.currentOverlay !== '';
    }

    /**
     * Attempts to grab the current overlay.
     * @returns The `currentOverlay` in our dictionary. If it
     * doesn't exist, we just return undefined.
     */

    public get(): HTMLImageElement {
        return this.overlays[this.currentOverlay];
    }

    /**
     * Updates the `currentOverlay` to the provided string.
     * @param overlay The new overlay to be set.
     */

    public update(overlay = ''): void {
        this.currentOverlay = overlay;
    }
}
