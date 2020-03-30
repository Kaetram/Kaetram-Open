"use strict";
exports.__esModule = true;
var _ = require("underscore");
var items_1 = require("../../../../util/items");
var messages_1 = require("../../../../network/messages");
var packets_1 = require("../../../../network/packets");
var utils_1 = require("../../../../util/utils");
var modules_1 = require("../../../../util/modules");
/**
 *
 */
var Enchant = /** @class */ (function () {
    /**
     * Tier 1 - Damage/Armour boost (1-5%)
     * Tier 2 - Damage boost (1-10% & 10% for special ability or special ability level up)
     * Tier 3 - Damage boost (1-15% & 15% for special ability or special ability level up)
     * Tier 4 - Damage boost (1-20% & 20% for special ability or special ability level up)
     * Tier 5 - Damage boost (1-25% & 25% for special ability or special ability level up)
     */
    function Enchant(player) {
        this.player = player;
        this.selectedItem = null;
        this.selectedShards = null;
    }
    Enchant.prototype.add = function (type, item) {
        var isItem = item === 'item';
        if (isItem && !items_1["default"].isEnchantable(item.id))
            return;
        if (type === 'item') {
            if (this.selectedItem)
                this.remove('item');
            this.selectedItem = item;
        }
        else if (type === 'shards') {
            if (this.selectedShards)
                this.remove('shards');
            this.selectedShards = item;
        }
        this.player.send(new messages_1["default"].Enchant(packets_1["default"].EnchantOpcode.Select, {
            type: type,
            index: item.index
        }));
    };
    Enchant.prototype.remove = function (type) {
        var index = -1;
        if (type === 'item' && this.selectedItem) {
            index = this.selectedItem.index;
            this.selectedItem = null;
        }
        else if (type === 'shards' && this.selectedShards) {
            index = this.selectedShards.index;
            this.selectedShards = null;
        }
        if (index < 0)
            return;
        this.player.send(new messages_1["default"].Enchant(packets_1["default"].EnchantOpcode.Remove, {
            type: type,
            index: index
        }));
    };
    Enchant.prototype.convert = function (shard) {
        if (!items_1["default"].isShard(shard.id) || !this.player.inventory.hasSpace())
            return;
        var tier = items_1["default"].getShardTier(shard.id);
        if (shard.count < 11 && tier > 5)
            return;
        for (var i = 0; i < shard.count; i += 10) {
            this.player.inventory.remove(shard.id, 10, shard.index);
            this.player.inventory.add({
                id: shard.id + 1,
                count: 1,
                ability: -1,
                abilityLevel: -1
            });
        }
    };
    Enchant.prototype.enchant = function () {
        if (!this.selectedItem) {
            this.player.notify('You have not selected an item to enchant.');
            return;
        }
        if (!this.selectedShards) {
            this.player.notify('You have to select shards to infuse.');
            return;
        }
        if (!this.verify()) {
            this.player.notify('This item cannot be enchanted.');
            return;
        }
        if (this.selectedShards.count < 10) {
            this.player.notify('You must have a minimum of 10 shards to enchant.');
            return;
        }
        /**
         * Implement probabilities here based on the number of shards
         * and reason them out.
         */
        var tier = items_1["default"].getShardTier(this.selectedShards.id);
        if (tier < 1)
            return;
        if (tier <= this.selectedItem.abilityLevel) {
            this.player.notify('This item has already been imbued with those shards.');
            return;
        }
        this.generateAbility(tier);
        this.player.inventory.remove(this.selectedShards.id, 10, this.selectedShards.index);
        this.remove('item');
        this.remove('shards');
        this.player.sync();
    };
    Enchant.prototype.generateAbility = function (tier) {
        var _this = this;
        var type = items_1["default"].getType(this.selectedItem.id);
        var probability = utils_1["default"].randomInt(0, 100);
        if (probability > 20 + 5 * tier) {
            this.player.notify('The item has failed to enchant.');
            return;
        }
        console.info("Selected item ability info: " + this.selectedItem.ability + " + " + this.selectedItem.abilityLevel + ".");
        if (this.hasAbility(this.selectedItem)) {
            var abilityName = Object.keys(modules_1["default"].Enchantment)[this.selectedItem.ability];
            this.selectedItem.abilityLevel = tier;
            this.player.notify("Your item has been imbued with level " + tier + " of the " + abilityName + " ability.");
            return;
        }
        switch (type) {
            case 'armor':
            case 'armorarcher':
                this.selectedItem.ability = utils_1["default"].randomInt(2, 3);
                break;
            case 'weapon':
                this.selectedItem.ability = utils_1["default"].randomInt(0, 1);
                break;
            case 'weaponarcher':
                this.selectedItem.ability = utils_1["default"].randomInt(4, 5);
                break;
            case 'pendant':
                break;
            case 'ring':
                break;
            case 'boots':
                break;
        }
        this.selectedItem.abilityLevel = tier;
        _.each(modules_1["default"].Enchantment, function (id, index) {
            if (id === _this.selectedItem.ability)
                _this.player.notify("Your item has been imbued with the " + index.toLowerCase() + " ability.");
        });
    };
    Enchant.prototype.verify = function () {
        return (items_1["default"].isEnchantable(this.selectedItem.id) &&
            items_1["default"].isShard(this.selectedShards.id));
    };
    Enchant.prototype.hasAbility = function (item) {
        return item.ability !== -1;
    };
    return Enchant;
}());
exports["default"] = Enchant;
