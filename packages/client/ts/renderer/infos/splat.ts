import Modules from '../../utils/modules';

export default class Splat {
    id: string;
    type: number;
    text: string;
    x: number;
    y: number;
    statique: boolean;
    opacity: number;
    lastTime: number;
    speed: number;
    updateSpeed: number;
    duration: number;
    fill: string;
    stroke: string;
    destroyCallback: (id: string) => void;

    constructor(id: string, type: number, text: string, x: number, y: number, statique: boolean) {
        this.id = id;
        this.type = type;
        this.text = text;
        this.x = x;
        this.y = y;

        this.statique = statique;

        this.opacity = 1.0;
        this.lastTime = 0;
        this.speed = 100;

        this.updateSpeed = type === Modules.Hits.Heal ? 2 : 1;
        this.duration = type === Modules.Hits.Heal ? 400 : 1000;
    }

    setColours(fill: string, stroke: string): void {
        this.fill = fill;
        this.stroke = stroke;
    }

    setDuration(duration: number): void {
        this.duration = duration;
    }

    tick(): void {
        if (!this.statique) this.y -= this.updateSpeed;

        this.opacity -= 70 / this.duration;

        if (this.opacity < 0) this.destroy();
    }

    update(time: number): void {
        if (time - this.lastTime > this.speed) {
            this.lastTime = time;
            this.tick();
        }
    }

    destroy(): void {
        this.destroyCallback?.(this.id);
    }

    onDestroy(callback: (id: string) => void): void {
        this.destroyCallback = callback;
    }
}
