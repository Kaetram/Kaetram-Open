/* global module */

const Points = require('./points');

class HitPoints extends Points {
    constructor(hitPoints, maxHitPoints) {
        super(hitPoints, maxHitPoints);
    }

    setHitPoints(hitPoints) {
        const self = this;

        super.setPoints(hitPoints);

        if (self.hitPointsCallback)
            self.hitPointsCallback();
    }

    setMaxHitPoints(maxHitPoints) {
        const self = this;

        super.setMaxPoints(maxHitPoints);

        if (self.maxHitPointsCallback)
            self.maxHitPointsCallback();
    }

    getHitPoints() {
        return this.points;
    }

    getMaxHitPoints() {
        return this.maxPoints;
    }

    onHitPoints(callback) {
        return this.hitPointsCallback = callback;
    }

    onMaxHitPoints(callback) {
        return this.maxHitPointsCallback = callback;
    }
}

module.exports = HitPoints;
