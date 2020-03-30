"use strict";
exports.__esModule = true;
var teamwar_1 = require("../minigames/impl/teamwar");
/**
 *
 */
var Minigames = /** @class */ (function () {
    function Minigames(world) {
        this.world = world;
        this.minigames = {};
        this.load();
    }
    Minigames.prototype.load = function () {
        this.minigames.TeamWar = new teamwar_1["default"](this.world);
        console.info("Finished loading " + Object.keys(this.minigames).length + " minigames.");
    };
    Minigames.prototype.getTeamWar = function () {
        return this.minigames.TeamWar;
    };
    return Minigames;
}());
exports["default"] = Minigames;
