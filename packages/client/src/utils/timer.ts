export default class Timer {
    public constructor(public time: number, public duration: number) {}

    public isOver(time: number): boolean {
        let over = false;

        if (time - this.time > this.duration) {
            over = true;
            this.time = time;
        }

        return over;
    }
}
