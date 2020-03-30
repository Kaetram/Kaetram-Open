export default class Timer {
    time: any;
    duration: any;
    constructor(start, duration) {
        this.time = start;
        this.duration = duration;
    }

    isOver(time) {
        let over = false;

        if (time - this.time > this.duration) {
            over = true;
            this.time = time;
        }

        return over;
    }
}
