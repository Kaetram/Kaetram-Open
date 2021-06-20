import log from '../lib/log';

export default class Overlay {
    public currentOverlay: string | null = null;
    private overlays: { [key: string]: HTMLImageElement } = {};

    public constructor() {
        this.load();
    }

    private async load(): Promise<void> {
        this.overlays['fog.png'] = await this.loadOverlay('fog.png');
    }

    private async loadOverlay(overlayName: string): Promise<HTMLImageElement> {
        const overlay = new Image();

        overlay.crossOrigin = 'Anonymous';
        const { default: image } = await import(`../../img/overlays/${overlayName}`);
        overlay.src = image;

        overlay.addEventListener('load', () => log.debug(`Loaded ${overlayName}`));

        return overlay;
    }

    public updateOverlay(overlay: string): void {
        this.currentOverlay = overlay in this.overlays ? overlay : overlay;
    }

    public getFog(): string | null {
        return this.currentOverlay;
    }
}
