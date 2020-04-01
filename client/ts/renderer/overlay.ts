import Game from '../game';

export default class Overlay {
    overlays: {};
    currentOverlay: any;

    constructor(public game: Game) {
        this.game = game;

        this.overlays = {};
        this.currentOverlay = null;

        this.load();
    }

    load() {
        this.overlays['fog.png'] = this.loadOverlay('fog.png');
    }

    loadOverlay(overlayName) {
        const overlay = new Image();

        overlay.crossOrigin = 'Anonymous';
        overlay.src = `img/overlays/${overlayName}`;

        overlay.onload = () => {
            if (this.game.isDebug()) console.info(`Loaded ${overlayName}`);
        };

        return overlay;
    }

    updateOverlay(overlay) {
        if (overlay in this.overlays) {
            this.currentOverlay = this.overlays[overlay];
        } else this.currentOverlay = overlay;
    }

    getFog() {
        return this.currentOverlay;
    }
}
