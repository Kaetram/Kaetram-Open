import Entity from '../entity';

export default class Projectile extends Entity {
    constructor(id, kind, owner) {
        super(id, kind);
        var self = this;
        self.owner = owner;

        self.name = '';

        self.startX = -1;
        self.startY = -1;

        self.destX = -1;
        self.destY = -1;

        self.special = -1;

        self.static = false;
        self.dynamic = false;

        self.speed = 150;

        self.angle = 0;

        self.lighting = null;
    }

    getId() {
        return this.id;
    }

    impact() {
        if (this.impactCallback) this.impactCallback();
    }

    setStart(x, y) {
        var self = this;

        self.setGridPosition(Math.floor(x / 16), Math.floor(y / 16));

        self.startX = x;
        self.startY = y;
    }

    setDestination(x, y) {
        var self = this;

        self.static = true;

        self.destX = x;
        self.destY = y;

        self.updateAngle();
    }

    setTarget(target) {
        var self = this;

        if (!target) return;

        self.dynamic = true;

        self.destX = target.x;
        self.destY = target.y;

        self.updateAngle();

        if (target.type !== 'mob') return;

        target.onMove(function () {
            self.destX = target.x;
            self.destY = target.y;

            self.updateAngle();
        });
    }

    getSpeed() {
        var self = this;

        return 1;
    }

    updateTarget(x, y) {
        var self = this;

        self.destX = x;
        self.destY = y;
    }

    hasPath() {
        return false;
    }

    updateAngle() {
        this.angle =
            Math.atan2(this.destY - this.y, this.destX - this.x) *
                (180 / Math.PI) -
            90;
    }

    onImpact(callback) {
        this.impactCallback = callback;
    }
}
