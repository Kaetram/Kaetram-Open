export default abstract class Points {
    public points: number;
    public maxPoints: number;

    protected constructor(points: number, maxPoints: number) {
        this.points = points;
        this.maxPoints = maxPoints;
    }

    protected increment(amount: number): void {
        this.setPoints(this.points + amount);
    }

    protected decrement(amount: number): void {
        this.setPoints(this.points - amount);
    }

    protected updatePoints(info: number[]): void {
        if (info.length === 0) return;

        let points = info.shift(),
            maxPoints = info.shift() || points;

        this.setMaxPoints(maxPoints as number);
        this.setPoints(points as number);
    }

    protected setPoints(points: number): void {
        this.points = points;

        if (this.points >= this.maxPoints) this.points = this.maxPoints;
        if (this.points < 0) this.points = 0;
    }

    protected setMaxPoints(maxPoints: number): void {
        this.maxPoints = maxPoints;
    }

    public isFull(): boolean {
        return this.points >= this.maxPoints;
    }

    public isEmpty(): boolean {
        return this.points <= 0;
    }

    public serialize(): number[] {
        return [this.points, this.maxPoints];
    }
}
