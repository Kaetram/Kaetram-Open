import type { ProcessedAnimation, ClientTile } from '@kaetram/common/types/map';

export default class Tile {
    public animationIndex = 0;

    // Denotes whether or not to delete the tile after the animation is complete.
    public expired = false;

    // Used to indicate the tile is no longer used in the rendering process.
    public unused = false;

    // WebGL rendering functions.
    public uploaded = true;

    public lastTime = 0;

    // Used to keep track of whether or not the tile is still being used.
    public lastAccessed = Date.now();

    public constructor(
        public id: number, // The tileId
        public index: number, // Index position of the tile.
        public animationInfo: ProcessedAnimation[],
        public isFlipped = false,
        public isHighTile = false, // Used by the WebGL renderer.
        public postAnimationData?: ClientTile
    ) {}

    /**
     * Animates a tile when the time elapsed since the last update is
     * greater than the duration of the animation. We change the tileId
     * when this update occurs and increment the animationIndex. Once
     * we exhaust all the animations in the tile, we reset the animationIndex.
     * @param time The current time in milliseconds (sent from the client updater).
     */

    public animate(time: number): void {
        // Expire the tile if it hasn't been accessed in 5 seconds.
        if (time - this.lastAccessed > 5000) this.unused = true;

        // The animation loop occurs once the time elapsed since the last update is greater than the duration of the animation.
        if (time - this.lastTime > this.getDuration()) {
            this.id = this.animationInfo[this.animationIndex].tileId;

            this.lastTime = time;

            this.uploaded = false;

            if (this.animationIndex >= Object.keys(this.animationInfo).length - 1) {
                if (this.postAnimationData) this.expired = true;

                this.animationIndex = 0;
            } else this.animationIndex++;
        }
    }

    /**
     * Obtains the duration of the current animation.
     * @returns The duration of the current animation.
     */

    public getDuration(): number {
        return this.animationInfo[this.animationIndex].duration;
    }
}
