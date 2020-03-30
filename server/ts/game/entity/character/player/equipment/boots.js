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
var equipment_1 = require("./equipment");
var items_1 = require("../../../../../util/items");
var modules_1 = require("../../../../../util/modules");
/**
 *
 */
var Boots = /** @class */ (function (_super) {
    __extends(Boots, _super);
    function Boots(name, id, count, ability, abilityLevel) {
        var _this = _super.call(this, name, id, count, ability, abilityLevel) || this;
        _this.bootsLevel = items_1["default"].getBootsLevel(name);
        return _this;
    }
    Boots.prototype.getBaseAmplifier = function () {
        return 1.0 + this.bootsLevel / 200;
    };
    Boots.prototype.getType = function () {
        return modules_1["default"].Equipment.Boots;
    };
    return Boots;
}(equipment_1["default"]));
exports["default"] = Boots;
