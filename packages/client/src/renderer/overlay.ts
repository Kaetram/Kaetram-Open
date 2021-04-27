import Game from '../game';
import log from '../lib/log';

export default class Overlay {
    game: Game;
    currentOverlay: string | null;
    overlays: { [key: string]: HTMLImageElement };

    constructor(game: Game) {
        this.game = game;

        this.overlays = {};
        this.currentOverlay = null;

        this.load();
    }

    async load(): Promise<void> {
        this.overlays['fog.png'] = await this.loadOverlay('fog.png');
    }

    async loadOverlay(overlayName: string): Promise<HTMLImageElement> {
        const overlay = new Image();

        overlay.crossOrigin = 'Anonymous';
        const { default: image } = await import(`../../img/overlays/${overlayName}`);
        overlay.src = image;

        overlay.addEventListener('load', () => log.debug(`Loaded ${overlayName}`));

        return overlay;
    }

    updateOverlay(overlay: string): void {
        this.currentOverlay = overlay in this.overlays ? overlay : overlay;
    }

    getFog(): string | null {
        return this.currentOverlay;
    }
}
