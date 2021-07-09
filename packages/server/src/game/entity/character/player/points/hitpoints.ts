import Points from './points';

class HitPoints extends Points {
    hitPointsCallback: Function;
    maxHitPointsCallback: Function;

    constructor(hitPoints: number, maxHitPoints: number) {
        super(hitPoints, maxHitPoints);
    }

    setHitPoints(hitPoints: number) {
        super.setPoints(hitPoints);

        if (this.hitPointsCallback) this.hitPointsCallback();
    }

    setMaxHitPoints(maxHitPoints: number) {
        super.setMaxPoints(maxHitPoints);

        if (this.maxHitPointsCallback) this.maxHitPointsCallback();
    }

    getHitPoints() {
        return this.points;
    }

    getMaxHitPoints() {
        return this.maxPoints;
    }

    onHitPoints(callback: Function) {
        return (this.hitPointsCallback = callback);
    }

    onMaxHitPoints(callback: Function) {
        return (this.maxHitPointsCallback = callback);
    }
}

export default HitPoints;
