import Points from './points';

export default class HitPoints extends Points {
    hitPointsCallback?(): void;
    maxHitPointsCallback?(): void;

    constructor(hitPoints: number, maxHitPoints: number) {
        super(hitPoints, maxHitPoints);
    }

    setHitPoints(hitPoints: number): void {
        super.setPoints(hitPoints);

        if (this.hitPointsCallback) this.hitPointsCallback();
    }

    setMaxHitPoints(maxHitPoints: number): void {
        super.setMaxPoints(maxHitPoints);

        if (this.maxHitPointsCallback) this.maxHitPointsCallback();
    }

    getHitPoints(): number {
        return this.points;
    }

    getMaxHitPoints(): number {
        return this.maxPoints;
    }

    onHitPoints(callback: () => void): () => void {
        return (this.hitPointsCallback = callback);
    }

    onMaxHitPoints(callback: () => void): () => void {
        return (this.maxHitPointsCallback = callback);
    }
}
