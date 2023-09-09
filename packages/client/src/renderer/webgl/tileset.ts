/**
 * Class object for organizing and storing information about tilesets. This contains
 * preliminary data for tilesets that shaders or WebGL contexts can use.
 */

import log from '../../lib/log';

import type Map from '../../map/map';

export default class Tileset {
    public textures: WebGLTexture[] = [];

    public constructor(
        private map: Map,
        private context: WebGLRenderingContext
    ) {
        // Create the textures for each tileset.
        for (let tileset of this.map.tilesets) this.createTexture(tileset);
    }

    /**
     * Creates a tileset texture and binds it to class specified WebGL context. Since we are using
     * two contexts (one for background and one for foreground), this will be called for each
     * respective context.
     * @param context The context that we want to bind the texture information to.
     * @param image The image that we want to use for the texture.
     */

    public createTexture(image: HTMLImageElement): void {
        let texture = this.context.createTexture();

        // Verify that the texture was created.
        if (!texture || !image)
            return log.error(`Failed to create texture for tileset: ${image.src}`);

        // Bind and apply the texture to the context
        this.context.bindTexture(this.context.TEXTURE_2D, texture);
        this.context.texImage2D(
            this.context.TEXTURE_2D,
            0,
            this.context.RGBA,
            this.context.RGBA,
            this.context.UNSIGNED_BYTE,
            image
        );

        // Apply the texture parameters to the context.
        this.context.texParameteri(
            this.context.TEXTURE_2D,
            this.context.TEXTURE_MAG_FILTER,
            this.context.NEAREST
        );
        this.context.texParameteri(
            this.context.TEXTURE_2D,
            this.context.TEXTURE_MIN_FILTER,
            this.context.NEAREST
        );
        this.context.texParameteri(
            this.context.TEXTURE_2D,
            this.context.TEXTURE_WRAP_S,
            this.context.CLAMP_TO_EDGE
        );
        this.context.texParameteri(
            this.context.TEXTURE_2D,
            this.context.TEXTURE_WRAP_T,
            this.context.CLAMP_TO_EDGE
        );

        // Append the texture to the list of textures.
        this.textures.push(texture);

        log.debug(`Created texture for tileset: ${image.src}`);
    }

    /**
     * Iterates through all the textures.
     */

    public forEachTexture(callback: (texture: WebGLTexture, index: number) => void): void {
        for (let i = 0; i < this.textures.length; i++) callback(this.textures[i], i);
    }
}
