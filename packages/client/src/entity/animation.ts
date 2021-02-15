interface Frame {
    index: number;
    x: number;
    y: number;
}

export default class Animation {
    name: string;
    length: number;
    row: number;
    width: number;
    height: number;
    currentFrame: Frame;
    count: number;
    lastTime: number;
    speed: number;

    /**
     * Ripped from BrowserQuest's client
     */
    constructor(name: string, length: number, row: number, width: number, height: number) {
        this.name = name;
        this.length = length;
        this.row = row;
        this.width = width;
        this.height = height;

        this.reset();
    }

    tick(): void {
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
    endCountCallback(): void {
        throw new Error('Method not implemented.');
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
