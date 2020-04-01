/**
 * Ripped from BrowserQuest's client
 */
export default class Animation {
    name: any;
    length: any;
    row: any;
    width: any;
    height: any;
    currentFrame: any;
    count: number;
    lastTime: number;
    speed: any;
    endCountCallback: Function;

    constructor(name, length, row, width, height) {
        this.name = name;
        this.length = length;
        this.row = row;
        this.width = width;
        this.height = height;

        this.reset();
    }

    tick() {
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

    update(time) {
        if (this.lastTime === 0 && this.name.substr(0, 3) === 'atk') {
            this.lastTime = time;
        }

        if (this.readyToAnimate(time)) {
            this.lastTime = time;
            this.tick();

            return true;
        }
        return false;
    }

    setCount(count, onEndCount) {
        this.count = count;
        this.endCountCallback = onEndCount;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setRow(row) {
        this.row = row;
    }

    readyToAnimate(time) {
        return time - this.lastTime > this.speed;
    }

    reset() {
        this.lastTime = 0;
        this.currentFrame = {
            index: 0,
            x: 0,
            y: this.row * this.height,
        };
    }
}
