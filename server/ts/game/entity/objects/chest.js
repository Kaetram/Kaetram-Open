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
var entity_1 = require("../entity");
var utils_1 = require("../../../util/utils");
/**
 *
 */
var Chest = /** @class */ (function (_super) {
    __extends(Chest, _super);
    function Chest(id, instance, x, y) {
        var _this = _super.call(this, id, 'chest', instance, x, y) || this;
        _this.respawnDuration = 25000;
        _this.static = false;
        _this.items = [];
        return _this;
    }
    Chest.prototype.openChest = function () {
        if (this.openCallback)
            this.openCallback();
    };
    Chest.prototype.respawn = function () {
        var _this = this;
        setTimeout(function () {
            if (_this.respawnCallback)
                _this.respawnCallback();
        }, this.respawnDuration);
    };
    Chest.prototype.getItem = function () {
        var random = utils_1["default"].randomInt(0, this.items.length - 1);
        var item = this.items[random];
        var count = 1;
        var probability = 100;
        if (item.includes(':')) {
            var itemData = item.split(':');
            item = itemData.shift(); // name
            count = parseInt(itemData.shift()); // count
            probability = parseInt(itemData.shift()); // probability
        }
        /**
         * We must ensure an item is always present in order
         * to avoid any unforeseen circumstances.
         */
        if (!item)
            return null;
        if (utils_1["default"].randomInt(0, 100) > probability)
            return null;
        return {
            string: item,
            count: count
        };
    };
    Chest.prototype.onOpen = function (callback) {
        this.openCallback = callback;
    };
    Chest.prototype.onRespawn = function (callback) {
        this.respawnCallback = callback;
    };
    return Chest;
}(entity_1["default"]));
exports["default"] = Chest;
