export default class Timer {
    time: number;
    duration: number;

    constructor(start: number, duration: number) {
        this.time = start;
        this.duration = duration;
    }

    isOver(time: number) {
        let over = false;

        if (time - this.time > this.duration) {
            over = true;
            this.time = time;
        }

        return over;
    }
}
