import Renderer from '../renderer';
import log from '../../lib/log';
import ProgramData from '../../utils/programdata';
import LayerVertex from '../shaders/layer.vert';
import LayerFragment from '../shaders/layer.frag';

import type Game from '../../game';
import type { RotatedTile } from '@kaetram/common/types/map';

/**
 * Huge thanks to the developer of `gl-tiled` for the point of reference in
 * creating a WebGL 2D tilemap renderer.
 * GitHub Repository: https://github.com/englercj/gl-tiled
 */

interface BlendMode {
    func: number[];
    equation: number;
}

export default class WebGL extends Renderer {
    // Override for context types and use webgl
    private backContext: WebGLRenderingContext = this.background.getContext('webgl')!;

    // Drawing contexts, where we load tileset textures and draw the map.
    private drawingContexts = [this.backContext];

    // Program data that contains the shader information for tiling.
    private shader = new ProgramData(this.backContext, LayerVertex, LayerFragment);

    // Texture information
    private backTexture: WebGLTexture = this.backContext.createTexture()!;

    private textureData!: Uint8Array;

    // Vertices, indices, buffers...
    private tilesetIndices: Int32Array = new Int32Array();
    private tilesetTileSizeBuffer: Float32Array = new Float32Array();
    private tilesetOffsetBuffer: Float32Array = new Float32Array();
    private inverseTilesetTextureSizeBuffer: Float32Array = new Float32Array();

    private inverseTileCount: Float32Array = new Float32Array(2);

    private quadBuffer = this.backContext.createBuffer()!;
    private quadVertices = new Float32Array([
        //x  y  u  v
        // eslint-disable-next-line prettier/prettier
        -1, -1, 0, 1,
         1, -1, 1, 1,
         1,  1, 1, 0,
        -1, -1, 0, 1,
         1,  1, 1, 0,
        -1,  1, 0, 0,
    ]);

    private attributeIndices = {
        aPosition: 0,
        aTexture: 1
    };

    // Blending
    private blendMode: BlendMode = {
        func: [WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA],
        equation: WebGLRenderingContext.FUNC_ADD
    };

    // Tileset textures
    private tilesetTextures: WebGLTexture[] = [];

    public constructor(game: Game) {
        super(game);
    }

    /**
     * Loads the tileset texture information for each rendering context. The back
     * and the front are used to separate high tiles from low tiles to give the
     * effect of z-index in a 2D environment.
     */

    public override load(): void {
        // Set the tileset texture indices.
        this.tilesetIndices = new Int32Array(this.map.tilesets.length);
        this.tilesetTileSizeBuffer = new Float32Array(this.map.tilesets.length * 2);
        this.tilesetOffsetBuffer = new Float32Array(this.map.tilesets.length * 2);
        this.inverseTilesetTextureSizeBuffer = new Float32Array(this.map.tilesets.length * 2);

        // Set the inverse tile count.
        this.inverseTileCount[0] = 1 / this.map.width;
        this.inverseTileCount[1] = 1 / this.map.height;

        // Load the buffer data...
        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            // Load the texture information for each tileset.
            for (let tileset of this.map.tilesets) this.createTexture(context, tileset);
        });

        // GOOD UNTIL HERE.... All tileset texture data is loaded properly.

        // Create the texture array where we store the tilemap information
        this.textureData = new Uint8Array(this.map.width * this.map.height * 4);

        // Initialize the texture data with the map information we have.
        this.loadMapTexture();

        // Load the buffer data for the tileset texture information.
        this.loadBufferData();

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
        // THIS IS GOOD FOR THE TIME BEING.
        for (let i = 0; i < this.textureData.length; i += 4) {
            let tileInfo = this.map.data[i / 4];

            if (!tileInfo) {
                this.textureData[i] = 255;
                this.textureData[i + 1] = 255;
                this.textureData[i + 2] = 255;
                this.textureData[i + 3] = 255;
                continue;
            }

            // Skip rotated tiles for now, we'll deal with them later.
            if ((tileInfo as RotatedTile).v) continue;

            if (Array.isArray(tileInfo)) tileInfo = tileInfo[0] as number;

            let tileset = this.map.getTilesetFromId(tileInfo as number),
                relativeId = (tileInfo as number) - tileset!.firstGid - 1,
                tilesWidth = tileset!.width / this.map.tileSize,
                tileX = relativeId % tilesWidth,
                tileY = Math.floor(relativeId / tilesWidth);

            // Wrong for now...
            this.textureData[i] = tileX;
            this.textureData[i + 1] = tileY;
            this.textureData[i + 2] = this.map.tilesets.indexOf(tileset!);
            this.textureData[i + 3] = 0;
        }

        console.log(this.textureData);
    }

    /**
     * Loads the buffer data of the tileset texture information.
     */

    private loadBufferData(): void {
        // ... Gotta look into what this does...
        for (let i = 0; i < this.tilesetIndices.length; ++i) this.tilesetIndices[i] = i + 1;

        for (let i = 0; i < this.map.tilesets.length; ++i) {
            this.tilesetTileSizeBuffer[i * 2] = this.map.tileSize;
            this.tilesetTileSizeBuffer[i * 2 + 1] = this.map.tileSize;

            /**
             * These are used for tile spacing and margin that Tiled provides. I'm
             * adding these since I just want the gl-tiled renderer to work.
             */

            this.tilesetOffsetBuffer[i * 2] = 0;
            this.tilesetOffsetBuffer[i * 2 + 1] = 0;

            // Apply inverse width and height of the tileset texture.
            this.inverseTilesetTextureSizeBuffer[i * 2] = 1 / this.map.tilesets[i].width;
            this.inverseTilesetTextureSizeBuffer[i * 2 + 1] = 1 / this.map.tilesets[i].height;
        }

        // Quad buffers
        this.quadBuffer = this.backContext.createBuffer()!;
        this.backContext.bindBuffer(this.backContext.ARRAY_BUFFER, this.quadBuffer);
        this.backContext.bufferData(
            this.backContext.ARRAY_BUFFER,
            this.quadVertices,
            this.backContext.STATIC_DRAW
        );

        // Synchronize the texture data with the WebGL texture.
        this.bindTileShaders(this.backContext);
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

            // Use the background program to draw the map.
            context.useProgram(this.shader.program);

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

        // Add the texture to the list of textures.
        this.tilesetTextures.push(texture);

        log.debug(`Created texture for ${image.src}`);
    }

    /**
     * Binds the tile layer shaders to the context for drawing tile data.
     * @param context The context we are binding the shaders to.
     */

    public bindTileShaders(context: WebGLRenderingContext): void {
        context.useProgram(this.shader.program);

        let inverseTileSize: Float32Array = new Float32Array([
            1 / this.map.tileSize,
            1 / this.map.tileSize
        ]);

        context.uniform1i(this.shader.uniforms.uLayer, 0);
        context.uniform2fv(this.shader.uniforms.uInverseLayerTileSize!, inverseTileSize);

        for (let index = 0; index < this.tilesetIndices.length; index++)
            context.uniform1i(
                context.getUniformLocation(this.shader.program, `uTilesets${index}`),
                this.tilesetIndices[index]
            );

        context.uniform2fv(this.shader.uniforms.uTilesetTileSize!, this.tilesetTileSizeBuffer);
        context.uniform2fv(this.shader.uniforms.uTilesetTileOffset!, this.tilesetOffsetBuffer);
        context.uniform2fv(
            this.shader.uniforms.uInverseTilesetTextureSize!,
            this.inverseTilesetTextureSizeBuffer
        );

        // Scaling and viewport
        let scaledX = this.background.width / this.camera.zoomFactor,
            scaledY = this.background.height / this.camera.zoomFactor,
            viewPort = new Float32Array([scaledX, scaledY]);

        context.uniform2fv(this.shader.uniforms.uViewportSize, viewPort);
        context.uniform1f(this.shader.uniforms.uInverseTileScale, 1 / this.camera.zoomFactor);
    }

    /**
     * Override for rendering tiles.
     */

    public override render(): void {
        this.draw();
    }

    /**
     * Draws the triangles responsible for rendering the map texture.
     * @param x Optional parameter to draw at a specific x coordinate.
     * @param y Optional parameter to draw at a specific y coordinate.
     */

    private draw(x = this.camera.x, y = this.camera.y): void {
        this.backContext.enable(this.backContext.BLEND);
        this.backContext.blendEquation(this.blendMode.equation);
        this.backContext.blendFunc(this.blendMode.func[0], this.blendMode.func[1]);

        // Bindings
        this.backContext.bindBuffer(this.backContext.ARRAY_BUFFER, this.quadBuffer);
        this.backContext.enableVertexAttribArray(this.attributeIndices.aPosition);
        this.backContext.enableVertexAttribArray(this.attributeIndices.aTexture);
        this.backContext.vertexAttribPointer(
            this.attributeIndices.aPosition,
            2,
            this.backContext.FLOAT,
            false,
            16,
            0
        );
        this.backContext.vertexAttribPointer(
            this.attributeIndices.aTexture,
            2,
            this.backContext.FLOAT,
            false,
            16,
            8
        );

        // Bind tileset textures...
        for (let i = 0; i < this.map.tilesets.length; i++) {
            this.backContext.activeTexture(this.backContext.TEXTURE1 + i);
            this.backContext.bindTexture(this.backContext.TEXTURE_2D, this.tilesetTextures[i]);
        }

        this.backContext.activeTexture(this.backContext.TEXTURE0);

        // Bind the tile layer shaders to the context.
        this.backContext.useProgram(this.shader.program);
        //this.bindTileShaders(this.backContext);

        // Uniforms for the tile shader layer... move these later
        this.backContext.uniform1f(this.shader.uniforms.uAlpha, 1);
        this.backContext.uniform1i(this.shader.uniforms.uRepeatTiles, 1);
        this.backContext.uniform2fv(
            this.shader.uniforms.uInverseLayerTileCount,
            this.inverseTileCount
        );

        this.backContext.uniform2f(this.shader.uniforms.uOffset, x, y);

        // Do the actual drawing.
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
