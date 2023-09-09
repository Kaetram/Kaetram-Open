export default class Transition {
    private startValue = 0;
    public endValue = 0;
    private duration = 0;
    public inProgress = false;
    private startTime!: number;

    private updateCallback?: (value: number) => void;
    private stopCallback?: () => void;

    /**
     * Starts a transition instance with the given parameters.
     * @param currentTime The current game time tick in milliseconds.
     * @param startValue Starting value of the transition.
     * @param endValue Ending value determining when transition ends.
     * @param duration How long the transition should be in milliseconds.
     * @param updateCallback A callback for every increment of the transition between start and end value.
     * @param stopCallback Callback for when transition finishes.
     */

    public start(
        currentTime: number,
        startValue: number,
        endValue: number,
        duration: number,
        updateCallback: (value: number) => void,
        stopCallback: () => void
    ): void {
        this.startTime = currentTime;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.updateCallback = updateCallback;
        this.stopCallback = stopCallback;

        this.inProgress = true;
    }

    /**
     * Function responsible for incrementing an update into the transition.
     * Say we start with a start value of 1, an end value of 16, and a duration of 100.
     * We are essentially updating the step function every 10 milliseconds until
     * we reach the end value. We continuously update until we reach the end value.
     * Once we do so, we end the transition.
     * @param currentTime The current game time tick.
     */

    public step(currentTime: number): void {
        if (!this.inProgress) return;

        // Current game tick minus the start time of the transition action.
        let elapsed = currentTime - this.startTime;

        // Max out if elapsed time is greater than duration of the transition.
        if (elapsed > this.duration) elapsed = this.duration;

        let diff = this.endValue - this.startValue,
            interval = Math.round(this.startValue + (diff / this.duration) * elapsed);

        if (elapsed === this.duration || interval === this.endValue) {
            this.inProgress = false;

            this.stopCallback?.();
        } else this.updateCallback?.(interval);
    }
}
