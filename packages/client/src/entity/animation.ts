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

    private endCountCallback!: () => void;

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
        let i = this.currentFrame.index;

        i = i < this.length - 1 ? i + 1 : 0;

        if (this.count > 0 && i === 0) {
            this.count -= 1;

            if (this.count === 0) {
                this.currentFrame.index = 0;
                this.endCountCallback();
                return;
            }
        }

        this.currentFrame.x = this.width * i;
        this.currentFrame.y = this.height * this.row;

        this.currentFrame.index = i;
    }

    update(time: number): boolean {
        if (this.lastTime === 0 && this.name.slice(0, 3) === 'atk') this.lastTime = time;

        if (this.readyToAnimate(time)) {
            this.lastTime = time;
            this.tick();

            return true;
        } else return false;
    }

    setCount(count: number, onEndCount: () => void): void {
        this.count = count;
        this.endCountCallback = onEndCount;
    }

    setSpeed(speed: number): void {
        this.speed = speed;
    }

    setRow(row: number): void {
        this.row = row;
    }

    readyToAnimate(time: number): boolean {
        return time - this.lastTime > this.speed;
    }

    reset(): void {
        this.lastTime = 0;
        this.currentFrame = {
            index: 0,
            x: 0,
            y: this.row * this.height
        };
    }
}
