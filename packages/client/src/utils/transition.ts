export default class Transition {
    public startValue = 0;
    public endValue = 0;
    private duration = 0;
    public inProgress = false;
    private startTime!: number;

    private count!: number;

    private updateFunction?(interval: number): void;
    private stopFunction?(): void;

    public start(
        currentTime: number,
        updateFunction: ((interval: number) => void) | undefined,
        stopFunction: (() => void) | undefined,
        startValue: number,
        endValue: number,
        duration: number
    ): void {
        this.startTime = currentTime;
        this.updateFunction = updateFunction;
        this.stopFunction = stopFunction;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;

        this.inProgress = true;
        this.count = 0;
    }

    public step(currentTime: number): void {
        if (!this.inProgress) return;

        if (this.count > 0) this.count--;
        else {
            let elapsed = currentTime - this.startTime;

            if (elapsed > this.duration) elapsed = this.duration;

            let diff = this.endValue - this.startValue,
                interval = Math.round(this.startValue + (diff / this.duration) * elapsed);

            if (elapsed === this.duration || interval === this.endValue) {
                this.stop();
                this.stopFunction?.();
            } else this.updateFunction?.(interval);
        }
    }

    // restart(currentTime: number, startValue: number, endValue: number): void {
    //     this.start(
    //         currentTime,
    //         this.updateFunction,
    //         this.stopFunction,
    //         startValue,
    //         endValue,
    //         this.duration
    //     );
    //     this.step(currentTime);
    // }

    private stop(): void {
        this.inProgress = false;
    }
}
