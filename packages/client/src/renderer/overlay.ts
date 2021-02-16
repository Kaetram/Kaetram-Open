import Game from '../game';
import log from '../lib/log';

export default class Overlay {
    game: Game;
    currentOverlay: string;
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
        overlay.src = (await import(`../../img/overlays/${overlayName}`)).default;

        overlay.addEventListener('load', () => {
            if (this.game.isDebug()) log.info(`Loaded ${overlayName}`);
        });

        return overlay;
    }

    updateOverlay(overlay: string): void {
        if (overlay in this.overlays) this.currentOverlay = overlay;
        else this.currentOverlay = overlay;
    }

    getFog(): string {
        return this.currentOverlay;
    }
}
