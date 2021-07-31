import log from '../lib/log';

export default class Overlay {
    public currentOverlay: string | null = null;
    private overlays: { [key: string]: HTMLImageElement } = {};

    public constructor() {
        this.load();
    }

    private load(): void {
        this.overlays.fog = this.loadOverlay('fog');
    }

    private loadOverlay(overlayName: string): HTMLImageElement {
        let overlay = new Image();

        overlay.crossOrigin = 'Anonymous';
        let image = `/img/overlays/${overlayName}.png`;
        overlay.src = image;

        overlay.addEventListener('load', () => log.debug(`Loaded ${overlayName}`));

        return overlay;
    }

    public updateOverlay(overlay: string): void {
        this.currentOverlay = overlay;
    }

    public getFog(): string | null {
        return this.currentOverlay;
    }
}
