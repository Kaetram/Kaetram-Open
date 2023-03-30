import Renderer from '../renderer';
import ImageVertex from '../shaders/image.vert';
import ImageFragment from '../shaders/image.frag';
import ProgramData from '../../utils/programdata';
import log from '../../lib/log';

import type Game from '../../game';

/**
 * Huge thanks to the developer of `gl-tiled` for the point of reference in
 * creating a WebGL 2D tilemap renderer.
 * GitHub Repository: https://github.com/englercj/gl-tiled
 */

export default class WebGL extends Renderer {
    // Override for context types and use webgl
    private entitiesContext: WebGLRenderingContext = this.entities.getContext('webgl')!;
    private backContext: WebGLRenderingContext = this.background.getContext('webgl')!;
    private foreContext: WebGLRenderingContext = this.foreground.getContext('webgl')!;
    private overlayContext: WebGLRenderingContext = this.overlay.getContext('webgl')!;
    private textContext: WebGLRenderingContext = this.textCanvas.getContext('webgl')!;
    private cursorContext: WebGLRenderingContext = this.cursor.getContext('webgl')!;

    // Drawing contexts, where we load tileset textures and draw the map.
    private drawingContexts = [this.backContext, this.foreContext];

    // Program data
    private backgroundProgram = new ProgramData(this.backContext, ImageVertex, ImageFragment);
    private foregroundProgram = new ProgramData(this.foreContext, ImageVertex, ImageFragment);

    public constructor(game: Game) {
        super(game);
    }

    /**
     * Loads the tileset texture information for each rendering context. The back
     * and the front are used to separate high tiles from low tiles to give the
     * effect of z-index in a 2D environment.
     */

    public override loadTextures(): void {
        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            // Load the texture information for each tileset.
            for (let tileset of this.map.tilesets) this.createTexture(context, tileset);
        });
    }

    /**
     * Creates a texture for a given image (the tilesheet image) and applies it
     * to the given context.
     * @param context The context we are applying the texture to.
     * @param image The image we are using to create the texture.
     */

    public createTexture(context: WebGLRenderingContext, image: HTMLImageElement): void {
        let texture = context.createTexture();

        if (!texture || !image) return log.error('Failed to create texture for Webcontext.');

        context.bindTexture(context.TEXTURE_2D, texture);
        context.texImage2D(
            context.TEXTURE_2D,
            0,
            context.RGBA,
            context.RGBA,
            context.UNSIGNED_BYTE,
            image
        );

        // Apply texture parameters
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
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

    /**
     * Iterates through all the drawing contexts (backContext and foreContext).
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: (context: WebGLRenderingContext) => void): void {
        for (let context in this.drawingContexts) callback(this.drawingContexts[context]);
    }
}
