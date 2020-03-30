"use strict";
exports.__esModule = true;
var Points = /** @class */ (function () {
    function Points(points, maxPoints) {
        this.points = points;
        this.maxPoints = maxPoints;
    }
    Points.prototype.heal = function (amount) {
        this.setPoints(this.points + amount);
        if (this.healCallback)
            this.healCallback();
    };
    Points.prototype.increment = function (amount) {
        this.points += amount;
    };
    Points.prototype.decrement = function (amount) {
        this.points -= amount;
    };
    Points.prototype.setPoints = function (points) {
        this.points = points;
        if (this.points >= this.maxPoints)
            this.points = this.maxPoints;
    };
    Points.prototype.setMaxPoints = function (maxPoints) {
        this.maxPoints = maxPoints;
    };
    Points.prototype.getData = function () {
        return [this.points, this.maxPoints];
    };
    Points.prototype.onHeal = function (callback) {
        this.healCallback = callback;
    };
    return Points;
}());
exports["default"] = Points;
