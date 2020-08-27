import Modules from '../../utils/modules';

export default class Splat {
    constructor(id, type, text, x, y, statique) {
        var self = this;

        self.id = id;
        self.type = type;
        self.text = text;
        self.x = x;
        self.y = y;

        self.statique = statique;

        self.opacity = 1.0;
        self.lastTime = 0;
        self.speed = 100;

        self.updateSpeed = type === Modules.Hits.Heal ? 2 : 1;
        self.duration = type === Modules.Hits.Heal ? 400 : 1000;
    }

    setColours(fill, stroke) {
        this.fill = fill;
        this.stroke = stroke;
    }

    setDuration(duration) {
        this.duration = duration;
    }

    tick() {
        var self = this;

        if (!self.statique) self.y -= self.updateSpeed;

        self.opacity -= 70 / self.duration;

        if (self.opacity < 0) self.destroy();
    }

    update(time) {
        var self = this;

        if (time - self.lastTime > self.speed) {
            self.lastTime = time;
            self.tick();
        }
    }

    destroy() {
        var self = this;

        if (self.destroyCallback) self.destroyCallback(self.id);
    }

    onDestroy(callback) {
        this.destroyCallback = callback;
    }
}
