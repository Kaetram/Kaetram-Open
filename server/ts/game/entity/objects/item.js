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
/**
 *
 */
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    function Item(id, instance, x, y, ability, abilityLevel) {
        var _this = _super.call(this, id, 'item', instance, x, y) || this;
        _this.static = false;
        _this.dropped = false;
        _this.shard = false;
        _this.count = 1;
        _this.ability = ability;
        _this.abilityLevel = abilityLevel;
        _this.tier = 1;
        if (isNaN(ability))
            _this.ability = -1;
        if (isNaN(abilityLevel))
            _this.abilityLevel = -1;
        _this.respawnTime = 30000;
        _this.despawnDuration = 4000;
        _this.blinkDelay = 20000;
        _this.despawnDelay = 1000;
        _this.blinkTimeout = null;
        _this.despawnTimeout = null;
        return _this;
    }
    Item.prototype.destroy = function () {
        if (this.blinkTimeout)
            clearTimeout(this.blinkTimeout);
        if (this.despawnTimeout)
            clearTimeout(this.despawnTimeout);
        if (this.static)
            this.respawn();
    };
    Item.prototype.despawn = function () {
        var _this = this;
        this.blinkTimeout = setTimeout(function () {
            if (_this.blinkCallback)
                _this.blinkCallback();
            _this.despawnTimeout = setTimeout(function () {
                if (_this.despawnCallback)
                    _this.despawnCallback();
            }, _this.despawnDuration);
        }, this.blinkDelay);
    };
    Item.prototype.respawn = function () {
        var _this = this;
        setTimeout(function () {
            if (_this.respawnCallback)
                _this.respawnCallback();
        }, this.respawnTime);
    };
    Item.prototype.getData = function () {
        return [this.id, this.count, this.ability, this.abilityLevel];
    };
    Item.prototype.getState = function () {
        var state = _super.prototype.getState.call(this);
        state.count = this.count;
        state.ability = this.ability;
        state.abilityLevel = this.abilityLevel;
        return state;
    };
    Item.prototype.setCount = function (count) {
        this.count = count;
    };
    Item.prototype.setAbility = function (ability) {
        this.ability = ability;
    };
    Item.prototype.setAbilityLevel = function (abilityLevel) {
        this.abilityLevel = abilityLevel;
    };
    Item.prototype.onRespawn = function (callback) {
        this.respawnCallback = callback;
    };
    Item.prototype.onBlink = function (callback) {
        this.blinkCallback = callback;
    };
    Item.prototype.onDespawn = function (callback) {
        this.despawnCallback = callback;
    };
    return Item;
}(entity_1["default"]));
exports["default"] = Item;
