export default class Points {
    public points: number;
    public maxPoints: number;

    healCallback?(): void;

    constructor(points: number, maxPoints: number) {
        if (isNaN(points)) points = maxPoints;

        this.points = points;
        this.maxPoints = maxPoints;
    }

    heal(amount: number): void {
        this.setPoints(this.points + amount);

        if (this.healCallback) this.healCallback();
    }

    increment(amount: number): void {
        this.points += amount;
    }

    decrement(amount: number): void {
        this.points -= amount;
    }

    setPoints(points: number): void {
        this.points = points;

        if (this.points >= this.maxPoints) this.points = this.maxPoints;
    }
    setMaxPoints(maxPoints: number): void {
        this.maxPoints = maxPoints;
    }

    getData(): number[] {
        return [this.points, this.maxPoints];
    }

    onHeal(callback: () => void): void {
        this.healCallback = callback;
    }
}
