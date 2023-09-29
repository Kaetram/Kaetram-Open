// Used to keep track of duration when logging out and back in.
export interface Duration {
    timeout: NodeJS.Timeout;
    startTime: number;
    duration: number;
}

export interface SerializedDuration {
    remainingTime: number;
}

export interface SerializedEffects {
    [effect: number]: SerializedDuration;
}
