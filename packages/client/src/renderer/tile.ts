import { ProcessedAnimation } from '@kaetram/common/types/map';

export default class Tile {
    public x = -1;
    public y = -1;

    private animationIndex = 0;
    private lastTime = 0;

    public constructor(
        public id: number, // The tileId
        public index: number, // Index position of the tile.
        public animationInfo: ProcessedAnimation[]
    ) {}

    /**
     * Animates a tile when the time elapsed since the last update is
     * greater than the duration of the animation. We change the tileId
     * when this update occurs and increment the animationIndex. Once
     * we exhaust all the animations in the tile, we reset the animationIndex.
     * @param time The current time in milliseconds (sent from the client updater).
     */

    public animate(time: number): void {
        if (time - this.lastTime > this.animationInfo[this.animationIndex].duration) {
            this.id = this.animationInfo[this.animationIndex].tileId;

            this.lastTime = time;

            if (this.animationIndex >= Object.keys(this.animationInfo).length - 1)
                this.animationIndex = 0;
            else this.animationIndex++;
        }
    }

    /**
     * Sets the tile's x and y position in the grid.
     * @param position Position object containing the x and y position.
     */

    public setPosition(position: Position): void {
        this.x = position.x;
        this.y = position.y;
    }
}
