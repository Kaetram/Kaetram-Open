"use strict";
exports.__esModule = true;
var abilities_1 = require("../../../../../../util/abilities");
/**
 *
 */
var Ability = /** @class */ (function () {
    function Ability(name, type) {
        this.name = name;
        this.type = type;
        this.level = -1;
        this.data = abilities_1["default"].Data[name];
    }
    return Ability;
}());
exports["default"] = Ability;
