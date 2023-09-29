export interface Frame {
    index: number;
    x: number;
    y: number;
}

type BopCallback = (bopIndex: number) => void;

export default class Animation {
    public frame: Frame = { index: 0, x: 0, y: 0 };
    public count = 1;
    public bopIndex = 0;
    public bopCount = 4; // Used for items bopping up and down.
    public decreaseBop = false;
    public stopped = false;

    private lastTime = Date.now();
    private speed = 100;

    private bopCallback?: BopCallback;
    private endCallback?: () => void;

    public constructor(
        public name: string,
        public length: number,
        public row: number,
        public width: number,
        public height: number,
        private withStop = false
    ) {
        this.reset();
    }

    /**
     * Updates the animation frame.
     * @param time The current game time.
     */

    public update(time: number): void {
        if (!this.canAnimate()) return;

        this.lastTime = time;

        // Used for bopping up an item when it is spawned on the ground.
        if (this.length === 1) {
            // If we are decreasing the bop index, we are moving the item down.
            if (this.decreaseBop) this.bopIndex--;
            else this.bopIndex++;

            // Toggle the bopping direction if we have reached the end of the animation.
            if (this.bopIndex >= this.bopCount) this.decreaseBop = true;
            else if (this.bopIndex <= 0) this.decreaseBop = false;

            return this.bopCallback?.(this.bopIndex);
        }

        // When the animation reaches the end of the frames, we reset it.
        if (this.frame.index >= this.length - 1) {
            if (this.count > 0) this.count--;

            // Invoke the callback if we have finished playing the animation.
            if (this.count <= 0) this.endCallback?.();

            // If stopped we pause on the last animation frame.
            if (this.withStop) {
                this.stopped = true;
                return;
            }

            return this.reset();
        }

        // Otherwise, we progress to the next frame.
        this.frame.index++;

        // Update the x and y coordinates of the frame.
        this.frame.x = this.frame.index * this.width;
        this.frame.y = this.row * this.height;
    }

    /**
     * Updates the amount of times we play the animation and sets the
     * callback handler if provided.
     * @param count The amount of times we are playing the animation.
     * @param onEnd The function to call once animation is completed.
     */

    public setCount(count: number, onEnd: () => void): void {
        this.count = count;

        this.endCallback = onEnd;
    }

    /**
     * Updates the speed of the animation.
     * @param speed The new speed of the animation.
     */

    public setSpeed(speed: number) {
        this.speed = speed;
    }

    /**
     * Updates the row of animations.
     * @param row The new number of rows.
     */

    public setRow(row: number): void {
        this.row = row;
    }

    /**
     * If we should progress to the next animation frame.
     * @returns Whether the last update time relative to now
     * is greater than the animation speed.
     */

    private canAnimate(): boolean {
        return Date.now() - this.lastTime > this.speed && !this.stopped;
    }

    /**
     * Used by tree objects to select the correct animation frame when trying to use the
     * base of the tree or the cut stump.
     * @returns The second animation in the row.
     */

    public getSecondFrame(): Frame {
        return {
            index: 1,
            x: this.width,
            y: this.row * this.height
        };
    }

    /**
     * Resets the animation to the first frame.
     */

    public reset(): void {
        this.lastTime = Date.now();

        this.frame = {
            index: 0,
            x: 0,
            y: this.row * this.height
        };
    }

    /**
     * Callback whenever the bopping index advances or decreases.
     * @param callback Contains the current bop index.
     */

    public onBop(callback: BopCallback): void {
        this.bopCallback = callback;
    }
}
