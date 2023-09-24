import ProgramData from './shader';
import Tileset from './tileset';
import Layer from './layer';

import Renderer from '../renderer';
import LayerVertex from '../shaders/layer.vert';
import LayerFragment from '../shaders/layer.frag';

import type Game from '../../game';
import type { ClientTile, TransformedTile } from '@kaetram/common/types/map';

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
    private foreContext: WebGLRenderingContext = this.foreground.getContext('webgl')!;

    // Drawing contexts, where we load tileset textures and draw the map.
    private drawingContexts = [this.backContext, this.foreContext];

    // Program data that contains the shader information for tiling.
    private backShader!: ProgramData;
    private foreShader!: ProgramData;

    // Storage for tileset textures and layer information.
    private tilesets: { [canvas: string]: Tileset } = {};
    private layers: Layer[] = [];

    // Vertices, indices, buffers...
    private tilesetIndices: Int32Array = new Int32Array();
    private tilesetTileSizeBuffer: Float32Array = new Float32Array();
    private tilesetOffsetBuffer: Float32Array = new Float32Array();
    private inverseTilesetTextureSizeBuffer: Float32Array = new Float32Array();

    private inverseTileCount: Float32Array = new Float32Array(2);

    private backQuadBuffer: WebGLBuffer = this.backContext.createBuffer()!;
    private foreQuadBuffer: WebGLBuffer = this.foreContext.createBuffer()!;

    private quadVertices = new Float32Array([
        //x  y  u  v
        // eslint-disable-next-line prettier/prettier
        -1, -1, 0, 1, 1, -1, 1, 1, 1, 1, 1, 0, -1, -1, 0, 1, 1, 1, 1, 0, -1, 1, 0, 0
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

    public constructor(game: Game) {
        super(game, 'webgl');
    }

    /**
     * Loads the tileset texture information for each rendering context. The back
     * and the front are used to separate high tiles from low tiles to give the
     * effect of z-index in a 2D environment.
     */

    public override load(): void {
        let tilesetCount = this.map.tilesets.length;

        // Initialize the shaders and format the fragment shader.
        this.backShader = new ProgramData(
            this.backContext,
            LayerVertex,
            this.getFragmentShader(tilesetCount)
        );
        this.foreShader = new ProgramData(
            this.foreContext,
            LayerVertex,
            this.getFragmentShader(tilesetCount)
        );

        // Set the tileset texture indices.
        this.tilesetIndices = new Int32Array(tilesetCount);
        this.tilesetTileSizeBuffer = new Float32Array(tilesetCount * 2);
        this.tilesetOffsetBuffer = new Float32Array(tilesetCount * 2);
        this.inverseTilesetTextureSizeBuffer = new Float32Array(tilesetCount * 2);

        // Initialize the tileset buffers
        for (let i = 0; i < tilesetCount; i++) {
            // Sets the index starting from 1 for the tileset texture.
            this.tilesetIndices[i] = i + 1;

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

        // Set the inverse tile count.
        this.inverseTileCount[0] = 1 / this.map.width;
        this.inverseTileCount[1] = 1 / this.map.height;

        // Load the buffer data...
        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            this.tilesets[(context.canvas as HTMLCanvasElement).id] = new Tileset(
                this.map,
                context
            );

            // Create the buffer for each context
            this.bindBuffer(context);

            // Bind the tileset textures to the context.
            this.bindTexture(context);

            // Bind the tile shaders to the context.
            this.bindTileShaders(context);
        });
    }

    /**
     * The `setTile` function handles information from the map to update a tile
     * at a specific index. We do this so that we are always in sync with the
     * information we receive from the server. Instead of loading the entire map
     * as a batch, we can load the map in chunks and update the map as we receive
     * information from the server.
     * @param index The index at which we want to update the tile.
     * @param data The data we want to update the tile with, may be an array or a number.
     */

    public override setTile(index: number, data: ClientTile): void {
        // Clear all the tiles of every layer at the specified index.
        this.clearTile(index);

        // Add the tile if it is not an array
        if (!Array.isArray(data)) return this.addTile(index, data);

        // If we find an array tile then we need to iterate through the array and pass the data to the layers.
        for (let tileIndex in data) this.addTile(index, data[tileIndex], ~~tileIndex);
    }

    /**
     * Creates the quad buffer for the specified context.
     * @param context The context we are creating the buffer for.
     */

    private bindBuffer(context: WebGLRenderingContext): void {
        context.bindBuffer(context.ARRAY_BUFFER, this.getQuadBuffer(context));
        context.bufferData(context.ARRAY_BUFFER, this.quadVertices, context.STATIC_DRAW);
    }

    /**
     * Binds the texture of the tile layer to the specified context.
     * @param context The context we are binding the texture to.
     */

    private bindTexture(context: WebGLRenderingContext): void {
        for (let layer of this.layers)
            layer.bindTexture(
                context,
                this.getShader(context)?.program,
                !this.isBackgroundContext(context)
            );
    }

    /**
     * Binds the tile layer shaders to the context for drawing tile data.
     * @param context The context we are binding the shaders to.
     */

    public bindTileShaders(context: WebGLRenderingContext): void {
        let shader = this.getShader(context);

        context.useProgram(shader.program);

        let inverseTileSize: Float32Array = new Float32Array([
            1 / this.map.tileSize,
            1 / this.map.tileSize
        ]);

        context.uniform1i(shader.uniforms.uLayer, 0);
        context.uniform2fv(shader.uniforms.uInverseLayerTileSize!, inverseTileSize);

        for (let index = 0; index < this.tilesetIndices.length; index++)
            context.uniform1i(
                context.getUniformLocation(shader.program, `uTilesets[${index}]`),
                this.tilesetIndices[index]
            );

        context.uniform2fv(shader.uniforms.uTilesetTileSize!, this.tilesetTileSizeBuffer);
        context.uniform2fv(shader.uniforms.uTilesetTileOffset!, this.tilesetOffsetBuffer);
        context.uniform2fv(
            shader.uniforms.uInverseTilesetTextureSize!,
            this.inverseTilesetTextureSizeBuffer
        );
    }

    /**
     * Override for the `bindTileLayers` function. We use this function after we
     * finish loading regions to signal to the drawing contexts that we need to
     * re-bind the tile layers with the new texture data.
     */

    public override bindTileLayers(): void {
        this.forEachDrawingContext((context: WebGLRenderingContext) => this.bindTexture(context));
    }

    /**
     * Override for the canvas resizing so that it handles view port
     * for WebGL contexts.
     */

    public override resize(): void {
        super.resize();

        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            // Scaling and viewport
            let viewPort = new Float32Array([this.screenWidth, this.screenHeight]),
                shader = this.getShader(context);

            context.viewport(0, 0, context.drawingBufferWidth, context.drawingBufferHeight);

            context.uniform2fv(shader.uniforms.uViewportSize, viewPort);
            context.uniform1f(shader.uniforms.uInverseTileScale, 1 / this.camera.zoomFactor);
        });
    }

    /**
     * Override for rendering tiles.
     */

    public override render(): void {
        this.draw();

        super.render();
    }

    /**
     * Draws the triangles responsible for rendering the map texture.
     * @param x Optional parameter to draw at a specific x coordinate.
     * @param y Optional parameter to draw at a specific y coordinate.
     */

    private draw(x = this.camera.x, y = this.camera.y): void {
        // Used for low power mode
        if (this.hasRenderedFrame() && (this.game.isLowPowerMode() || this.mobile)) return;

        // Iterate through the drawing contexts and apply the necessary transformations/attributes.
        this.forEachDrawingContext((context: WebGLRenderingContext) => {
            context.enable(context.BLEND);
            context.blendEquation(this.blendMode.equation);
            context.blendFunc(this.blendMode.func[0], this.blendMode.func[1]);

            // Bindings
            context.bindBuffer(context.ARRAY_BUFFER, this.getQuadBuffer(context));
            context.enableVertexAttribArray(this.attributeIndices.aPosition);
            context.enableVertexAttribArray(this.attributeIndices.aTexture);
            context.vertexAttribPointer(
                this.attributeIndices.aPosition,
                2,
                context.FLOAT,
                false,
                16,
                0
            );
            context.vertexAttribPointer(
                this.attributeIndices.aTexture,
                2,
                context.FLOAT,
                false,
                16,
                8
            );

            this.tilesets[(context.canvas as HTMLCanvasElement).id].forEachTexture(
                (texture: WebGLTexture, index: number) => {
                    context.activeTexture(context.TEXTURE1 + index);
                    context.bindTexture(context.TEXTURE_2D, texture);
                }
            );

            context.activeTexture(context.TEXTURE0);

            let shader = this.getShader(context),
                isBackground = this.isBackgroundContext(context);

            // Bind the tile layer shaders to the context.
            context.useProgram(shader.program);

            /**
             * These are uniforms for the shaders, things like alpha, repeating tiles,
             * inverse tile count. We apply a different alpha value to the background
             * layers as opposed to foreground since we don't want the background to
             * obstruct certain foreground elements (tree shadows).
             */

            context.uniform1f(shader.uniforms.uAlpha, isBackground ? 1 : 1.5);
            context.uniform1i(shader.uniforms.uRepeatTiles, 1);
            context.uniform2fv(shader.uniforms.uInverseLayerTileCount, this.inverseTileCount);

            context.uniform2f(shader.uniforms.uOffset, x, y);

            // Do the actual drawing.
            for (let layer of this.layers)
                layer.draw(context, this.game.time, !isBackground, this.game.isLowPowerMode());
        });

        this.saveFrame();
    }

    /**
     * Handles the creation and applying of tiles to the layers. If the layer doesn't
     * exist then we create it. This ensures that we only create the layers that are
     * actually used.
     * @param index The index of the tile (in the tilemap).
     * @param tileId The value of the tileId.
     * @param layerIndex Which layer index we are drawing to.
     */

    private addTile(index: number, tile: number | TransformedTile, layerIndex = 0): void {
        if (!this.layers[layerIndex]) this.layers[layerIndex] = new Layer(this);

        this.layers[layerIndex].addTile(index, tile, this.map.isFlipped(tile));
    }

    /**
     * Used for clearing a tile from all the layers when we want to dynamically
     * update a piece of the map.
     * @param index The index at which we are clearing the tile.
     */

    private clearTile(index: number): void {
        for (let layer of this.layers) layer.clear(index);
    }

    /**
     * Checks whether or not the context is the background context.
     * @param context The context that we are checking.
     * @returns Whether or not the context is the background context.
     */

    private isBackgroundContext(context: WebGLRenderingContext): boolean {
        return (context.canvas as HTMLCanvasElement).id === 'background';
    }

    /**
     * Grabs the appropriate shader based on the context specified.
     * @param context The context we are grabbing the shader for.
     * @returns The shader program data for the context.
     */

    private getShader(context: WebGLRenderingContext): ProgramData {
        return this.isBackgroundContext(context) ? this.backShader : this.foreShader;
    }

    /**
     * Grabs the buffer based on the provided context parameter.
     * @param context The context we are grabbing the buffer for.
     * @returns The WebGL buffer that is associated with the context.
     */

    private getQuadBuffer(context: WebGLRenderingContext): WebGLBuffer {
        return this.isBackgroundContext(context) ? this.backQuadBuffer : this.foreQuadBuffer;
    }

    /**
     * Since we do not support dynamically allocating array sizes in the fragment shader
     * we need to do some hacking and manually update the constant value.
     * @param count The number of tilesets that we are using.
     * @returns The formatted string of the fragment shader.
     */

    private getFragmentShader(count: number): string {
        return LayerFragment.replace('TILESET_COUNT', count.toString());
    }

    /**
     * Iterates through all the drawing contexts (backContext and foreContext).
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: (context: WebGLRenderingContext) => void): void {
        for (let context in this.drawingContexts) callback(this.drawingContexts[context]);
    }
}
