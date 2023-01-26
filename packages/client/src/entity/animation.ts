interface Frame {
    index: number;
    x: number;
    y: number;
}

export default class Animation {
    public frame: Frame = { index: 0, x: 0, y: 0 };
    public count = 1;

    private lastTime = Date.now();
    private speed = 100;

    private endCallback?: () => void;

    public constructor(
        public name: string,
        private length: number,
        public row: number,
        private width: number,
        private height: number
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

        if (this.frame.index >= this.length - 1) {
            if (this.count > 0) this.count--;

            if (this.count <= 0) this.endCallback?.();

            return this.reset();
        }

        this.frame.index++;

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
        return Date.now() - this.lastTime > this.speed;
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
}
