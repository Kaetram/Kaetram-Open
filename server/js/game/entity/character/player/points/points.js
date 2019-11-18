/* global module */

class Points {
    constructor(points, maxPoints) {
        const self = this;

        self.points = points;
        self.maxPoints = maxPoints;
    }

    heal(amount) {
        const self = this;

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
        const self = this;

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
