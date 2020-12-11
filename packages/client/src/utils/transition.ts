export default class Transition {
    inProgress: boolean;
    endValue: number;
    startValue: number;
    duration: number;
    startTime: number;
    updateFunction: (interval: number) => void;
    stopFunction: () => void;
    count: number;

    constructor() {
        this.startValue = 0;
        this.endValue = 0;
        this.duration = 0;
        this.inProgress = false;
    }

    start(
        currentTime: number,
        updateFunction: (interval: number) => void,
        stopFunction: () => void,
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

    step(currentTime: number): void {
        if (!this.inProgress) return;

        if (this.count > 0) this.count--;
        else {
            let elapsed = currentTime - this.startTime;

            if (elapsed > this.duration) elapsed = this.duration;

            const diff = this.endValue - this.startValue,
                interval = Math.round(this.startValue + (diff / this.duration) * elapsed);

            if (elapsed === this.duration || interval === this.endValue) {
                this.stop();
                this.stopFunction?.();
            } else this.updateFunction?.(interval);
        }
    }

    restart(currentTime: number, startValue: number, endValue: number): void {
        this.start(
            currentTime,
            this.updateFunction,
            this.stopFunction,
            startValue,
            endValue,
            this.duration
        );
        this.step(currentTime);
    }

    stop(): void {
        this.inProgress = false;
    }
}
