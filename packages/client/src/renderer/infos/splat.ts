import { Modules } from '@kaetram/common/network';

export default class Splat {
    public opacity = 1;
    private lastTime = 0;
    private speed = 100;

    private updateSpeed = 1;
    private duration = 1000;

    public fill!: string;
    public stroke!: string;

    private destroyCallback?: (id: string) => void;

    public constructor(
        public id: string,
        public type: Modules.Hits,
        public text: string,
        public x: number,
        public y: number,
        private statique: boolean
    ) {
        if (type === Modules.Hits.Heal) {
            this.updateSpeed = 2;
            this.duration = 400;
        }
    }

    public setColours(fill: string, stroke: string): void {
        this.fill = fill;
        this.stroke = stroke;
    }

    private tick(): void {
        if (!this.statique) this.y -= this.updateSpeed;

        this.opacity -= 70 / this.duration;

        if (this.opacity < 0) this.destroy();
    }

    public update(time: number): void {
        if (time - this.lastTime > this.speed) {
            this.lastTime = time;
            this.tick();
        }
    }

    private destroy(): void {
        this.destroyCallback?.(this.id);
    }

    public onDestroy(callback: (id: string) => void): void {
        this.destroyCallback = callback;
    }
}
