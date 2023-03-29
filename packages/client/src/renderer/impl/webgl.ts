import Renderer from '../renderer';
import ImageVertex from '../shaders/image.vert';
import ImageFragment from '../shaders/image.frag';

import type Game from '../../game';

export default class WebGL extends Renderer {
    // Override for context types and use webgl
    private entitiesContext: WebGLRenderingContext = this.entities.getContext('webgl')!;
    private backContext: WebGLRenderingContext = this.background.getContext('webgl')!;
    private foreContext: WebGLRenderingContext = this.foreground.getContext('webgl')!;
    private overlayContext: WebGLRenderingContext = this.overlay.getContext('webgl')!;
    private textContext: WebGLRenderingContext = this.textCanvas.getContext('webgl')!;
    private cursorContext: WebGLRenderingContext = this.cursor.getContext('webgl')!;

    public constructor(game: Game) {
        super(game);

        // Prepare the webgl context

        console.log(ImageVertex);
        console.log(ImageFragment);
    }

    /**
     * Creates the image and tile shader objects used for rendering.
     */

    public createShaders(): void {
        //
    }

    /**
     * Override for rendering tiles.
     */

    public override render(): void {
        //
    }
}
