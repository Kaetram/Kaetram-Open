import Modules from '../../utils/modules';

export default class Splat {
    id: any;
    type: any;
    text: any;
    x: any;
    y: any;
    statique: any;
    opacity: number;
    lastTime: number;
    speed: number;
    updateSpeed: number;
    duration: number;
    fill: any;
    stroke: any;
    destroyCallback: any;

    constructor(id, type, text, x, y, statique) {
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

    setColours(fill, stroke) {
        this.fill = fill;
        this.stroke = stroke;
    }

    setDuration(duration) {
        this.duration = duration;
    }

    tick() {
        if (!this.statique) this.y -= this.updateSpeed;

        this.opacity -= 70 / this.duration;

        if (this.opacity < 0) this.destroy();
    }

    update(time) {
        if (time - this.lastTime > this.speed) {
            this.lastTime = time;
            this.tick();
        }
    }

    destroy() {
        if (this.destroyCallback) this.destroyCallback(this.id);
    }

    onDestroy(callback) {
        this.destroyCallback = callback;
    }
}
