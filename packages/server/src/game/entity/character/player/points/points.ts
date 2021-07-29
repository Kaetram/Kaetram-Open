export default abstract class Points {
    public points: number;
    public maxPoints: number;

    private healCallback?(): void;

    protected constructor(points: number, maxPoints: number) {
        this.points = isNaN(points) ? maxPoints : points;
        this.maxPoints = maxPoints;
    }

    public heal(amount: number): void {
        this.setPoints(this.points + amount);

        this.healCallback?.();
    }

    public increment(amount: number): void {
        this.points += amount;
    }

    public decrement(amount: number): void {
        this.points -= amount;
    }

    protected setPoints(points: number): void {
        this.points = points;

        if (this.points >= this.maxPoints) this.points = this.maxPoints;
    }
    protected setMaxPoints(maxPoints: number): void {
        this.maxPoints = maxPoints;
    }

    public getData(): number[] {
        return [this.points, this.maxPoints];
    }

    public onHeal(callback: () => void): void {
        this.healCallback = callback;
    }
}
