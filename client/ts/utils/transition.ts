export default class Transition {
    startValue: number;
    endValue: number;
    duration: number;
    inProgress: boolean;
    startTime: any;
    updateFunction: any;
    stopFunction: any;
    count: number;

    constructor() {
        this.startValue = 0;
        this.endValue = 0;
        this.duration = 0;
        this.inProgress = false;
    }

    start(
        currentTime,
        updateFunction,
        stopFunction,
        startValue,
        endValue,
        duration
    ) {
        this.startTime = currentTime;
        this.updateFunction = updateFunction;
        this.stopFunction = stopFunction;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;

        this.inProgress = true;
        this.count = 0;
    }

    step(currentTime) {
        if (!this.inProgress) return;

        if (this.count > 0) this.count--;
        else {
            let elapsed = currentTime - this.startTime;

            if (elapsed > this.duration) elapsed = this.duration;

            const diff = this.endValue - this.startValue;
            const interval = Math.round(
                this.startValue + (diff / this.duration) * elapsed
            );

            if (elapsed === this.duration || interval === this.endValue) {
                this.stop();
                if (this.stopFunction) this.stopFunction();
            } else if (this.updateFunction) this.updateFunction(interval);
        }
    }

    restart(currentTime, startValue, endValue) {
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

    stop() {
        this.inProgress = false;
    }
}
