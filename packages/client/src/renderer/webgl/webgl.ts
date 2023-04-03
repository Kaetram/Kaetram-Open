import ProgramData from './shader';
import Tileset from './tileset';
import Layer from './layer';

import Renderer from '../renderer';
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
    private foreContext: WebGLRenderingContext = this.foreground.getContext('webgl')!;

    // Drawing contexts, where we load tileset textures and draw the map.
    private drawingContexts = [this.backContext, this.foreContext];

    // Program data that contains the shader information for tiling.
    private backShader = new ProgramData(this.backContext, LayerVertex, LayerFragment);
    private foreShader = new ProgramData(this.foreContext, LayerVertex, LayerFragment);

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

        // Initialize the tileset buffers
        for (let i = 0; i < this.map.tilesets.length; i++) {
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

        // Initialize the texture data with the map information we have.
        this.loadMapTexture();

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
     * The map texture iterates through all the tile elements in the map and
     * determines (based on the structure of the tile) which layer to place the
     * tile on. For example, if we have a tile whose value is a number (i.e. 1),
     * then we place the tile on the first index of the layers array. If we obtain
     * an array of numbers (i.e. [1, 2]), then the first element is the 0 index
     * on the layers and the second element is the 1 index on the layers.
     */

    private loadMapTexture(): void {
        for (let index = 0; index < this.map.data.length; index++) {
            let info = this.map.data[index];

            // If we find an array tile then we need to iterate through the array and pass the data to the layers.
            if (Array.isArray(info)) {
                for (let tile in info) this.addTile(index, info[tile], parseInt(tile));
                continue;
            }

            // Otherwise just add the tile to the first layer.
            this.addTile(index, info);
        }
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
                this.getShader(context).program,
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
                context.getUniformLocation(shader.program, `uTilesets${index}`),
                this.tilesetIndices[index]
            );

        context.uniform2fv(shader.uniforms.uTilesetTileSize!, this.tilesetTileSizeBuffer);
        context.uniform2fv(shader.uniforms.uTilesetTileOffset!, this.tilesetOffsetBuffer);
        context.uniform2fv(
            shader.uniforms.uInverseTilesetTextureSize!,
            this.inverseTilesetTextureSizeBuffer
        );

        // Scaling and viewport
        let scaledX = this.background.width / this.camera.zoomFactor,
            scaledY = this.background.height / this.camera.zoomFactor,
            viewPort = new Float32Array([scaledX, scaledY]);

        context.uniform2fv(shader.uniforms.uViewportSize, viewPort);
        context.uniform1f(shader.uniforms.uInverseTileScale, 1 / this.camera.zoomFactor);
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

            let shader = this.getShader(context);

            // Bind the tile layer shaders to the context.
            context.useProgram(shader.program);

            // Uniforms for the tile shader layer... move these later
            context.uniform1f(shader.uniforms.uAlpha, 1);
            context.uniform1i(shader.uniforms.uRepeatTiles, 1);
            context.uniform2fv(shader.uniforms.uInverseLayerTileCount, this.inverseTileCount);

            context.uniform2f(shader.uniforms.uOffset, x, y);

            // Do the actual drawing.
            for (let layer of this.layers) {
                context.bindTexture(
                    context.TEXTURE_2D,
                    this.isBackgroundContext(context)
                        ? layer.backgroundTexture
                        : layer.foregroundTexture
                );
                context.drawArrays(context.TRIANGLES, 0, 6);
            }
        });
    }

    /**
     * Handles the creation and applying of tiles to the layers. If the layer doesn't
     * exist then we create it. This ensures that we only create the layers that are
     * actually used.
     * @param index The index of the tile (in the tilemap).
     * @param tileId The value of the tileId.
     * @param layerIndex Which layer index we are drawing to.
     */

    private addTile(index: number, tile: number | RotatedTile, layerIndex = 0): void {
        if (!this.layers[layerIndex]) this.layers[layerIndex] = new Layer(this.map);

        this.layers[layerIndex].addTile(index, tile, this.isFlipped(tile as RotatedTile));
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
     * Iterates through all the drawing contexts (backContext and foreContext).
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: (context: WebGLRenderingContext) => void): void {
        for (let context in this.drawingContexts) callback(this.drawingContexts[context]);
    }
}
