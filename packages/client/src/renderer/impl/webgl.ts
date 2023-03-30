import Renderer from '../renderer';
import log from '../../lib/log';
import ProgramData from '../../utils/programdata';
import ImageVertex from '../shaders/image.vert';
import ImageFragment from '../shaders/image.frag';
import LayerVertex from '../shaders/layer.vert';
import LayerFragment from '../shaders/layer.frag';

import type Game from '../../game';
import type { RotatedTile } from '@kaetram/common/types/map';

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

    // Texture information
    private backTexture: WebGLTexture = this.backContext.createTexture()!;
    private foreTexture: WebGLTexture = this.foreContext.createTexture()!;

    private textureData!: Uint8Array;

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

        // Create the texture array where we store the tileset information.
        this.textureData = new Uint8Array(this.map.width * this.map.height * 4);

        // Initialize the texture data with the map information we have.
        this.loadMapTexture();

        // Synchronize the texture data with the WebGL texture.
        this.synchronize();
    }

    /**
     * We iterate through each pixel index in the texture data and apply
     * the tile information at that index. The first element is the x coordinate,
     * the second is the y coordinate, the third is id of the tile. The fourth
     * is the flip flags.
     */

    private loadMapTexture(): void {
        for (let i = 0; i < this.textureData.length; i += 4) {
            let tileInfo = this.map.data[i / 4];

            // Skip rotated tiles for now, we'll deal with them later.
            if ((tileInfo as RotatedTile).v) continue;

            let position = this.map.indexToCoord(i / 4);

            this.textureData[i] = position.x;
            this.textureData[i + 1] = position.y;
            // Prototype
            this.textureData[i + 2] = Array.isArray(tileInfo)
                ? (tileInfo[0] as number)
                : (tileInfo as number);
        }
    }

    /**
     * Synchronizes the texture data with the WebGL texture. Binds it to the
     * context and applies the texture parameters.
     */

    private synchronize(): void {
        // TODO - Separate the top and bottom layers into two textures, they're intermingled right now.
        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            context.bindTexture(context.TEXTURE_2D, this.backTexture);

            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
            context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);

            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_S,
                context.CLAMP_TO_EDGE
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_T,
                context.CLAMP_TO_EDGE
            );

            // Upload the texture data to the GPU.
            context.texImage2D(
                context.TEXTURE_2D,
                0,
                context.RGBA,
                this.map.width,
                this.map.height,
                0,
                context.RGBA,
                context.UNSIGNED_BYTE,
                this.textureData
            );
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
        this.draw();
    }

    private draw(x = this.camera.x, y = this.camera.y): void {
        this.backContext.enable(this.backContext.BLEND);
        this.backContext.blendEquation(this.backContext.FUNC_ADD);

        this.backContext.activeTexture(this.backContext.TEXTURE0);

        this.backContext.bindTexture(this.backContext.TEXTURE_2D, this.backTexture);
        this.backContext.drawArrays(this.backContext.TRIANGLES, 0, 6);
    }

    /**
     * Iterates through all the drawing contexts (backContext and foreContext).
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: (context: WebGLRenderingContext) => void): void {
        for (let context in this.drawingContexts) callback(this.drawingContexts[context]);
    }
}
