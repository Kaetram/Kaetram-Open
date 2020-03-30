"use strict";
exports.__esModule = true;
var Minigame = /** @class */ (function () {
    function Minigame(id, name) {
        this.id = id;
        this.name = name;
    }
    Minigame.prototype.getId = function () {
        return this.id;
    };
    Minigame.prototype.getName = function () {
        return this.name;
    };
    return Minigame;
}());
exports["default"] = Minigame;
