export default class Countdown {
    id: string;
    time: number;
    string: string;
    lastTime: number;
    updateTime: number;
    destroyCallback: (id: string) => void;

    constructor(id: string, time: number) {
        this.id = id;
        this.time = time;
        this.string = null;

        this.lastTime = 0;
        this.updateTime = 1000; // Update every second.
    }

    tick(): void {
        if (this.time < 1) return;

        // Originally was gonna do this in the renderer
        // But it's best to update the string here.

        this.string = this.getStringFormat();

        this.time--;
    }

    update(time: number): void {
        if (time - this.lastTime > this.updateTime) this.lastTime = time;
    }

    getStringFormat(): string {
        if (this.time < 60) return `00:${this.time}`;

        const minutes = Math.floor(this.time / 60),
            seconds = this.time - minutes * 60;

        if (minutes < 10) return `0${minutes}:${seconds}`;

        return `${minutes}:${seconds}`;
    }

    destroy(): void {
        this.destroyCallback?.(this.id);
    }

    onDestroy(callback: (id: string) => void): void {
        this.destroyCallback = callback;
    }
}
