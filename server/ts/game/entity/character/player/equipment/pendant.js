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
var Pendant = /** @class */ (function (_super) {
    __extends(Pendant, _super);
    function Pendant(name, id, count, ability, abilityLevel) {
        var _this = _super.call(this, name, id, count, ability, abilityLevel) || this;
        _this.pendantLevel = items_1["default"].getPendantLevel(name);
        return _this;
    }
    Pendant.prototype.getBaseAmplifier = function () {
        return 1.0 + this.pendantLevel / 100;
    };
    Pendant.prototype.getType = function () {
        return modules_1["default"].Equipment.Pendant;
    };
    return Pendant;
}(equipment_1["default"]));
exports["default"] = Pendant;
