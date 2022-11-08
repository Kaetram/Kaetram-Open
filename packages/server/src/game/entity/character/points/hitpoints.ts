import Points from './points';

export default class HitPoints extends Points {
    private hitPointsCallback?: () => void;

    public constructor(hitPoints: number, maxHitPoints?: number) {
        super(hitPoints, maxHitPoints || hitPoints);
    }

    public override increment(amount: number): void {
        super.increment(amount);

        this.hitPointsCallback?.();
    }

    public override decrement(amount: number): void {
        super.decrement(amount);

        this.hitPointsCallback?.();
    }

    public updateHitPoints(hitPoints: number, maxHitPoints?: number): void {
        super.updatePoints(hitPoints, maxHitPoints);
    }

    public setHitPoints(hitPoints: number): void {
        super.setPoints(hitPoints);

        this.hitPointsCallback?.();
    }

    public setMaxHitPoints(maxHitPoints: number): void {
        super.setMaxPoints(maxHitPoints);
    }

    public getHitPoints(): number {
        return this.points;
    }

    public getMaxHitPoints(): number {
        return this.maxPoints;
    }

    public onHitPoints(callback: () => void): void {
        this.hitPointsCallback = callback;
    }
}
