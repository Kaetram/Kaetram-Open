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
var Mana = /** @class */ (function (_super) {
    __extends(Mana, _super);
    function Mana(mana, maxMana) {
        return _super.call(this, mana, maxMana) || this;
    }
    Mana.prototype.setMana = function (mana) {
        this.points = mana;
        if (this.manaCallback)
            this.manaCallback();
    };
    Mana.prototype.setMaxMana = function (maxMana) {
        this.maxPoints = maxMana;
        if (this.maxManaCallback)
            this.maxManaCallback();
    };
    Mana.prototype.getMana = function () {
        return this.points;
    };
    Mana.prototype.getMaxMana = function () {
        return this.maxPoints;
    };
    Mana.prototype.onMana = function (callback) {
        this.manaCallback = callback;
    };
    Mana.prototype.onMaxMana = function (callback) {
        this.maxManaCallback = callback;
    };
    return Mana;
}(points_1["default"]));
exports["default"] = Mana;
