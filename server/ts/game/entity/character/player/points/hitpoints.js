"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var points_1 = require("./points");
/**
 *
 */
var HitPoints = /** @class */ (function (_super) {
    __extends(HitPoints, _super);
    function HitPoints(hitPoints, maxHitPoints) {
        return _super.call(this, hitPoints, maxHitPoints) || this;
    }
    HitPoints.prototype.setHitPoints = function (hitPoints) {
        _super.prototype.setPoints.call(this, hitPoints);
        if (this.hitPointsCallback)
            this.hitPointsCallback();
    };
    HitPoints.prototype.setMaxHitPoints = function (maxHitPoints) {
        _super.prototype.setMaxPoints.call(this, maxHitPoints);
        if (this.maxHitPointsCallback)
            this.maxHitPointsCallback();
    };
    HitPoints.prototype.getHitPoints = function () {
        return this.points;
    };
    HitPoints.prototype.getMaxHitPoints = function () {
        return this.maxPoints;
    };
    HitPoints.prototype.onHitPoints = function (callback) {
        return (this.hitPointsCallback = callback);
    };
    HitPoints.prototype.onMaxHitPoints = function (callback) {
        return (this.maxHitPointsCallback = callback);
    };
    return HitPoints;
}(points_1["default"]));
exports["default"] = HitPoints;
