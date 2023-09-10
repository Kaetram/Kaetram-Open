import Tile from '../../map/tile';

import type WebGL from './webgl';
import type Map from '../../map/map';
import type { TransformedTile } from '@kaetram/common/types/map';

/**
 * A layer is a class object that corresponds with a layer in the map data. This is used to
 * structure the tile map data and organize it into layers. Layers are generated on the go,
 * which means that if the area of the map contains 2 layers, then 2 layers will be generated.
 * If the player steps into an area that contains 3 layers, another layer object will be created
 * and added to the map.
 */

enum FlipFlags {
    FlippedAntiDiagonal = 0x20_00_00_00,
    FlippedVertical = 0x40_00_00_00,
    FlippedHorizontal = 0x80_00_00_00
}

interface AnimatedTiles {
    [index: number]: Tile;
}

export default class Layer {
    private map: Map;

    /**
     * The background texture is for the normal tiles that are rendered on top of each other.
     * The foreground layer are tiles that are rendered on top of the background layer and that
     * the player is behind. Since I am still experimenting with WebGL I might be able to incorporate
     * all of the rendering in one canvas in the nearby future. Please have patience.
     */

    // The texture data for each index in the layer.
    public backgroundData: Uint8Array;
    public foregroundData: Uint8Array;

    // The texture object for foreground and background.
    public backgroundTexture!: WebGLTexture;
    public foregroundTexture!: WebGLTexture;

    // Animated tiles pertaining to this layer.
    private animatedTiles: AnimatedTiles = {};

    public constructor(private renderer: WebGL) {
        this.map = renderer.map;

        this.backgroundData = new Uint8Array(this.map.width * this.map.height * 4);
        this.foregroundData = new Uint8Array(this.map.width * this.map.height * 4);

        // Fill the texture data with 255's
        this.backgroundData.fill(255);
        this.foregroundData.fill(255);
    }

    /**
     * Binds the texture to the WebGL context. The foreground flag determines which texture
     * data we want to bind to the context.
     * @param context The context that we want to bind the texture to.
     * @param program The shader program that we want to bind the texture to.
     * @param foreground Whether we want to bind the foreground or background texture.
     */

    public bindTexture(
        context: WebGLRenderingContext,
        program: WebGLProgram,
        foreground = false
    ): void {
        // Program hasn't loaded yet so there's no need to bind the texture.
        if (!program) return;

        // Create the textures if they do not exist.
        if (!this.backgroundTexture && !foreground)
            this.backgroundTexture = context.createTexture()!;
        if (!this.foregroundTexture && foreground)
            this.foregroundTexture = context.createTexture()!;

        context.bindTexture(
            context.TEXTURE_2D,
            foreground ? this.foregroundTexture : this.backgroundTexture
        );

        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);

        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);

        // Use the background program to draw the map.
        context.useProgram(program);

        // Upload the texture data to the GPU.
        this.upload(context, foreground);
    }

    /**
     * Function used to request the GPU to update the texture data by
     * uploading the latest information (after we make modifications)
     * to the GPU.
     * @param context The context on which we want to upload the texture data.
     * @param foreground Whether we want this data to be uploaded to the foreground or background texture.
     */

    private upload(context: WebGLRenderingContext, foreground = false): void {
        context.texImage2D(
            context.TEXTURE_2D,
            0,
            context.RGBA,
            this.map.width,
            this.map.height,
            0,
            context.RGBA,
            context.UNSIGNED_BYTE,
            foreground ? this.foregroundData : this.backgroundData
        );
    }

    /**
     * Clears a tile from the texture data at a provided index.
     * @param index The index at which we want to clear the tile.
     */

    public clear(index: number): void {
        // Remove the tile from the animated tiles.
        delete this.animatedTiles[index];

        // Increase the index.
        index *= 4;

        this.backgroundData[index] =
            this.backgroundData[index + 1] =
            this.backgroundData[index + 2] =
            this.backgroundData[index + 3] =
                255;

        this.foregroundData[index] =
            this.foregroundData[index + 1] =
            this.foregroundData[index + 2] =
            this.foregroundData[index + 3] =
                255;
    }

    /**
     * We add a tile to the specific texture data based on the provided index and value.
     * @param index Represents the index at which the tile will be added (index * 4 for the buffer.)
     * @param tile Contains information about the tile, this can be a flat tile (number value) or a rotated
     * tile with flags applied to it. Depending on the context we extract the information and apply it to the
     * texture data.
     * @param foreground Whether we want to add the tile to the foreground or background texture data.
     */

    public addTile(index: number, tile: number | TransformedTile, flipped = false): void {
        // Grab the index in the respective texture data array.
        let tileId = flipped ? (tile as TransformedTile).tileId : (tile as number),
            isHighTile = this.map.isHighTile(tileId),
            textureData = isHighTile ? this.foregroundData : this.backgroundData,
            dataIndex = index * 4;

        // If the tileId is 0 or invalid it means it's an empty tile, so we just update the texture data with 255.
        if (!tileId) {
            textureData[dataIndex] =
                textureData[dataIndex + 1] =
                textureData[dataIndex + 2] =
                textureData[dataIndex + 3] =
                    255;
            return;
        }

        // Extract the information from the tileset and apply it to the texture data.
        let tileset = this.map.getTilesetFromId(tileId)!;

        // If the tileset is invalid, then we just return.
        if (!tileset) return;

        let relativeId = tileId - tileset.firstGid,
            tilesWidth = tileset.width / this.map.tileSize;

        // Write the texture information to the texture data array.
        textureData[dataIndex] = relativeId % tilesWidth; // tile's x coordinate in the tileset
        textureData[dataIndex + 1] = ~~(relativeId / tilesWidth); // tile's y coordinate in the tileset
        textureData[dataIndex + 2] = tileset.index; // tileset index
        textureData[dataIndex + 3] = flipped ? this.getFlippedFlag(tile as TransformedTile) : 0; // tile flags

        // Skip if the tile is already animated.
        if (index in this.animatedTiles) return;

        // Create an animated tile if the tile is animated.
        if (this.map.isAnimatedTile(tileId))
            this.animatedTiles[index] = new Tile(
                tileId,
                index,
                this.map.getTileAnimation(tileId),
                flipped,
                isHighTile,
                this.map.dynamicAnimatedTiles[index]
            );
    }

    /**
     * Function called every frame to draw the map for the specified layer.
     * @param context The context on which we are drawing the map.
     * @param time The game tick epoch time.
     * @param foreground Whether or not the context specified is the foreground or background.
     * @param lowPower Whether or not we are in low power mode, disables animated tiles.
     */

    public draw(
        context: WebGLRenderingContext,
        time: number,
        foreground = false,
        lowPower = false
    ): void {
        // Bind the texture according to whether we want to draw the foreground or background.
        context.bindTexture(
            context.TEXTURE_2D,
            foreground ? this.foregroundTexture : this.backgroundTexture
        );

        // Draw the triangles
        context.drawArrays(context.TRIANGLES, 0, 6);

        // Do not draw animated tiles if we are in low power mode.
        if (lowPower) return;

        // Whether or not at least one tile requires an upload.
        let upload = false;

        // Update the animated tiles and do necessary uploads.
        for (let index in this.animatedTiles) {
            let tile = this.animatedTiles[index];

            // Skip if the tile's layering doesn't match the current layer.
            if (tile.isHighTile && !foreground) continue;

            // Update using the current game tick.
            tile.animate(time);

            // An expired tile is replaced with the post animation tile.
            if (tile.expired) {
                // We ask the renderer to re-set the tile with the post animation data.
                this.renderer.setTile(tile.index, tile.postAnimationData!);

                delete this.animatedTiles[index];

                continue;
            }

            // Upload indicates that the tile is ready to be reloaded into the texture data.
            if (!tile.uploaded) {
                // We update the tile in the texture data.
                this.addTile(tile.index, tile.id + 1, tile.isFlipped);

                // We request an upload for the entire texture data.
                upload = true;

                // We mark the tile as uploaded.
                tile.uploaded = true;
            }
        }

        // If the upload flag is toggled then we upload the entire texture data.
        if (upload) this.upload(context, foreground);
    }

    /**
     * Calcualtes the flip flags for rendering rotated tiles.
     * @param flag The rotated tile that contains the flags.
     * @returns The bit flag after applying all transformations.
     */

    private getFlippedFlag(tile: TransformedTile): number {
        return (
            (tile.h ? (FlipFlags.FlippedHorizontal as number) >> 28 : 0) |
            (tile.v ? (FlipFlags.FlippedVertical as number) >> 28 : 0) |
            (tile.d ? (FlipFlags.FlippedAntiDiagonal as number) >> 28 : 0)
        );
    }
}
