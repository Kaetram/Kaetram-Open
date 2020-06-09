/* global module */

class Points {

    constructor(points, maxPoints) {
        if (isNaN(points))
            points = maxPoints;

        this.points = points;
        this.maxPoints = maxPoints;
    }

    heal(amount) {
        this.setPoints(this.points + amount);

        if (this.healCallback)
            this.healCallback();
    }

    increment(amount) {
        this.points += amount;
    }

    decrement(amount) {
        this.points -= amount;
    }

    setPoints(points) {
        this.points = points;

        if (this.points >= this.maxPoints)
            this.points = this.maxPoints;
    }

    setMaxPoints(maxPoints) {
        this.maxPoints = maxPoints;
    }

    getData() {
        return [this.points, this.maxPoints];
    }

    onHeal(callback) {
        this.healCallback = callback;
    }

}

export default Points;
