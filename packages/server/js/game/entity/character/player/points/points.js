/* global module */

class Points {

    constructor(points, maxPoints) {
        let self = this;

        if (isNaN(points))
            points = maxPoints;

        self.points = points;
        self.maxPoints = maxPoints;
    }

    heal(amount) {
        let self = this;

        self.setPoints(self.points + amount);

        if (self.healCallback)
            self.healCallback();
    }

    increment(amount) {
        this.points += amount;
    }

    decrement(amount) {
        this.points -= amount;
    }

    setPoints(points) {
        let self = this;

        self.points = points;

        if (self.points >= self.maxPoints)
            self.points = self.maxPoints;
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

module.exports = Points;
