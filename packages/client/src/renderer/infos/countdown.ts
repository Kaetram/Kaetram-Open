export default class Countdown {
    public string: string | null = null;

    private time = Date.now();
    private lastTime = 0;
    private updateTime = 1000; // Update every second.

    private destroyCallback?(id: string): void;

    public constructor(public id: string) {}

    private tick(): void {
        if (this.time < 1) return;

        // Originally was gonna do this in the renderer
        // But it's best to update the string here.

        this.string = this.getStringFormat();

        this.time--;
    }

    public update(time: number): void {
        if (time - this.lastTime > this.updateTime) this.lastTime = time;
    }

    private getStringFormat(): string {
        if (this.time < 60) return `00:${this.time}`;

        let minutes = Math.floor(this.time / 60),
            seconds = this.time - minutes * 60;

        if (minutes < 10) return `0${minutes}:${seconds}`;

        return `${minutes}:${seconds}`;
    }

    private destroy(): void {
        this.destroyCallback?.(this.id);
    }

    public onDestroy(callback: (id: string) => void): void {
        this.destroyCallback = callback;
    }
}
