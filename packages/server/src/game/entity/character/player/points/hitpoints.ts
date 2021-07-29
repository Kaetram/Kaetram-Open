import Points from './points';

export default class HitPoints extends Points {
    private hitPointsCallback?(): void;
    private maxHitPointsCallback?(): void;

    public constructor(hitPoints: number, maxHitPoints: number) {
        super(hitPoints, maxHitPoints);
    }

    public setHitPoints(hitPoints: number): void {
        super.setPoints(hitPoints);

        this.hitPointsCallback?.();
    }

    public setMaxHitPoints(maxHitPoints: number): void {
        super.setMaxPoints(maxHitPoints);

        this.maxHitPointsCallback?.();
    }

    public getHitPoints(): number {
        return this.points;
    }

    public getMaxHitPoints(): number {
        return this.maxPoints;
    }

    public onHitPoints(callback: () => void): () => void {
        return (this.hitPointsCallback = callback);
    }

    public onMaxHitPoints(callback: () => void): () => void {
        return (this.maxHitPointsCallback = callback);
    }
}
