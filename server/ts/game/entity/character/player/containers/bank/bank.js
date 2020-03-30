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
/**
 *
 */
var Bank = /** @class */ (function (_super) {
    __extends(Bank, _super);
    function Bank(owner, size) {
        var _this = _super.call(this, 'Bank', owner, size) || this;
        _this.open = false;
        return _this;
    }
    Bank.prototype.load = function (ids, counts, abilities, abilityLevels) {
        _super.prototype.load.call(this, ids, counts, abilities, abilityLevels);
        this.owner.send(new messages_1["default"].Bank(packets_1["default"].BankOpcode.Batch, [this.size, this.slots]));
    };
    Bank.prototype.add = function (id, count, ability, abilityLevel) {
        if (!this.canHold(id, count)) {
            this.owner.send(new messages_1["default"].Notification(packets_1["default"].NotificationOpcode.Text, 'You do not have enough space in your bank.'));
            return false;
        }
        var slot = _super.prototype.add.call(this, id, parseInt(count), ability, abilityLevel);
        this.owner.send(new messages_1["default"].Bank(packets_1["default"].BankOpcode.Add, slot));
        this.owner.save();
        return true;
    };
    Bank.prototype.remove = function (id, count, index) {
        if (!_super.prototype.remove.call(this, index, id, count))
            return;
        this.owner.send(new messages_1["default"].Bank(packets_1["default"].BankOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));
        this.owner.save();
    };
    return Bank;
}(container_1["default"]));
exports["default"] = Bank;
