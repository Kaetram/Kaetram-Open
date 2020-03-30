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
var container_1 = require("../container");
var messages_1 = require("../../../../../../network/messages");
var packets_1 = require("../../../../../../network/packets");
var constants_1 = require("./constants");
/**
 *
 */
var Inventory = /** @class */ (function (_super) {
    __extends(Inventory, _super);
    function Inventory(owner, size) {
        return _super.call(this, 'Inventory', owner, size) || this;
    }
    Inventory.prototype.load = function (ids, counts, abilities, abilityLevels) {
        _super.prototype.load.call(this, ids, counts, abilities, abilityLevels);
        this.owner.send(new messages_1["default"].Inventory(packets_1["default"].InventoryOpcode.Batch, [
            this.size,
            this.slots
        ]));
    };
    Inventory.prototype.add = function (item, count) {
        if (!count)
            count = -1;
        if (count === -1)
            // default to moving whole stack
            count = parseInt(item.count);
        if (!this.canHold(item.id, count)) {
            this.owner.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, constants_1["default"].InventoryFull));
            return false;
        }
        var slot = _super.prototype.add.call(this, item.id, count, item.ability, item.abilityLevel);
        if (!slot)
            return false;
        this.owner.send(new messages_1["default"].Inventory(packets_1["default"].InventoryOpcode.Add, slot));
        this.owner.save();
        if (item.instance)
            this.owner.world.removeItem(item);
        return true;
    };
    Inventory.prototype.remove = function (id, count, index) {
        if (!id || !count)
            return false;
        if (!index)
            index = this.getIndex(id);
        if (!_super.prototype.remove.call(this, index, id, count))
            return false;
        this.owner.send(new messages_1["default"].Inventory(packets_1["default"].InventoryOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));
        this.owner.save();
        return true;
    };
    return Inventory;
}(container_1["default"]));
exports["default"] = Inventory;
