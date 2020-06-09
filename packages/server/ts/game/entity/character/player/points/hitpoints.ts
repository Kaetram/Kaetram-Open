/* global module */

import Points from './points';

class HitPoints extends Points {

    constructor(hitPoints, maxHitPoints) {
        super(hitPoints, maxHitPoints);
    }

    setHitPoints(hitPoints) {
        super.setPoints(hitPoints);

        if (this.hitPointsCallback)
            this.hitPointsCallback();
    }

    setMaxHitPoints(maxHitPoints) {
        super.setMaxPoints(maxHitPoints);

        if (this.maxHitPointsCallback)
            this.maxHitPointsCallback();
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

export default HitPoints;
