/* global module */

class Points {
    public points: number;
    public maxPoints: number;

    healCallback: Function;

    constructor(points: number, maxPoints: number) {
        if (isNaN(points)) points = maxPoints;

        this.points = points;
        this.maxPoints = maxPoints;
    }

    heal(amount: number) {
        this.setPoints(this.points + amount);

        if (this.healCallback) this.healCallback();
    }

    increment(amount: number) {
        this.points += amount;
    }

    decrement(amount: number) {
        this.points -= amount;
    }

    setPoints(points: number) {
        this.points = points;

        if (this.points >= this.maxPoints) this.points = this.maxPoints;
    }

    setMaxPoints(maxPoints: number) {
        this.maxPoints = maxPoints;
    }

    getData() {
        return [this.points, this.maxPoints];
    }

    onHeal(callback: Function) {
        this.healCallback = callback;
    }
}

export default Points;
