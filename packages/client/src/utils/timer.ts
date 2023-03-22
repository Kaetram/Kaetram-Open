export default class Timer {
    public constructor(public time: number, public duration: number) {}

    /**
     * Checks if the timer has expired, that is,
     * the current time is greater than the time
     * the timer was greated by duration amount.
     * @param time The current game time.
     * @returns Whether or not the timer has expired.
     */

    public isOver(time: number): boolean {
        return time - this.time > this.duration;
    }
}
