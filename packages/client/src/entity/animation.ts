interface Frame {
    index: number;
    x: number;
    y: number;
}

/**
 * Ripped from BrowserQuest's client.
 */
export default class Animation {
    public currentFrame!: Frame;
    public count!: number;

    private lastTime!: number;
    private speed!: number;

    private endCountCallback?(): void;

    public constructor(
        public name: string,
        private length: number,
        public row: number,
        private width: number,
        private height: number
    ) {
        this.reset();
    }

    private tick(): void {
        let { currentFrame, length, count, width, height, row } = this,
            i = currentFrame.index;

        i = i < length - 1 ? i + 1 : 0;

        if (count > 0 && i === 0) {
            this.count -= 1;

            let { count } = this;

            if (count === 0) {
                currentFrame.index = 0;
                this.endCountCallback?.();
                return;
            }
        }

        currentFrame.x = width * i;
        currentFrame.y = height * row;

        currentFrame.index = i;
    }

    public update(time: number): boolean {
        let { lastTime, name } = this;

        if (lastTime === 0 && name.slice(0, 3) === 'atk') this.lastTime = time;

        if (this.readyToAnimate(time)) {
            this.lastTime = time;
            this.tick();

            return true;
        }
        return false;
    }

    public setCount(count: number, onEndCount: () => void): void {
        this.count = count;
        this.endCountCallback = onEndCount;
    }

    public setSpeed(speed: number): void {
        this.speed = speed;
    }

    public setRow(row: number): void {
        this.row = row;
    }

    private readyToAnimate(time: number): boolean {
        return time - this.lastTime > this.speed;
    }

    public reset(): void {
        this.lastTime = 0;

        this.currentFrame = {
            index: 0,
            x: 0,
            y: this.row * this.height
        };
    }
}
