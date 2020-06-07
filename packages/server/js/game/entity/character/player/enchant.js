/* global module */

let _ = require('underscore'),
    Items = require('../../../../util/items'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets'),
    Utils = require('../../../../util/utils'),
    Modules = require('../../../../util/modules');

class Enchant {

    /**
     * Tier 1 - Damage/Armour boost (1-5%)
     * Tier 2 - Damage boost (1-10% & 10% for special ability or special ability level up)
     * Tier 3 - Damage boost (1-15% & 15% for special ability or special ability level up)
     * Tier 4 - Damage boost (1-20% & 20% for special ability or special ability level up)
     * Tier 5 - Damage boost (1-25% & 25% for special ability or special ability level up)
     */


    constructor(player) {
        let self = this;

        self.player = player;

        self.selectedItem = null;
        self.selectedShards = null;
    }

    add(type, item) {
        let self = this,
            isItem = item === 'item';

        if (isItem && !Items.isEnchantable(item.id))
            return;

        if (type === 'item') {
            if (self.selectedItem)
                self.remove('item');

            self.selectedItem = item;

        } else if (type === 'shards') {

            if (self.selectedShards)
                self.remove('shards');

            self.selectedShards = item;
        }

        self.player.send(new Messages.Enchant(Packets.EnchantOpcode.Select, {
            type: type,
            index: item.index
        }));
    }

    remove(type) {
        let self = this,
            index = -1;

        if (type === 'item' && self.selectedItem) {

            index = self.selectedItem.index;

            self.selectedItem = null;

        } else if (type === 'shards' && self.selectedShards) {

            index = self.selectedShards.index;

            self.selectedShards = null;
        }

        if (index < 0)
            return;

        self.player.send(new Messages.Enchant(Packets.EnchantOpcode.Remove, {
            type: type,
            index: index
        }));
    }

    convert(shard) {
        let self = this;

        if (!Items.isShard(shard.id) || !self.player.inventory.hasSpace())
            return;

        let tier = Items.getShardTier(shard.id);

        if (shard.count < 11 && tier > 5)
            return;

        for (let i = 0; i < shard.count; i += 10) {
            self.player.inventory.remove(shard.id, 10, shard.index);

            self.player.inventory.add({
                id: shard.id + 1,
                count: 1,
                ability: -1,
                abilityLevel: -1
            });
        }
    }

    enchant() {
        let self = this;

        if (!self.selectedItem) {
            self.player.notify('You have not selected an item to enchant.');
            return;
        }

        if (!self.selectedShards) {
            self.player.notify('You have to select shards to infuse.');
            return;
        }

        if (!self.verify()) {
            self.player.notify('This item cannot be enchanted.');
            return;
        }

        if (self.selectedShards.count < 10) {
            self.player.notify('You must have a minimum of 10 shards to enchant.');
            return;
        }

        /**
         * Implement probabilities here based on the number of shards
         * and reason them out.
         */

        let tier = Items.getShardTier(self.selectedShards.id);

        if (tier < 1)
            return;

        if (tier <= self.selectedItem.abilityLevel) {

            self.player.notify('This item has already been imbued with those shards.');

            return;
        }

        self.generateAbility(tier);

        self.player.inventory.remove(self.selectedShards.id, 10, self.selectedShards.index);

        self.remove('item');
        self.remove('shards');

        self.player.sync();
    }

    generateAbility(tier) {
        let self = this,
            type = Items.getType(self.selectedItem.id),
            probability = Utils.randomInt(0, 100);

        if (probability > 20 + (5 * tier)) {
            self.player.notify('The item has failed to enchant.');
            return;
        }

        log.info(`Selected item ability info: ${self.selectedItem.ability} + ${self.selectedItem.abilityLevel}.`);

        if (self.hasAbility(self.selectedItem)) {
            let abilityName = Object.keys(Modules.Enchantment)[self.selectedItem.ability];

            self.selectedItem.abilityLevel = tier;

            self.player.notify(`Your item has been imbued with level ${tier} of the ${abilityName} ability.`);

            return;
        }

        switch (type) {
            case 'armor':
            case 'armorarcher':

                self.selectedItem.ability = Utils.randomInt(2, 3);

                break;

            case 'weapon':

                self.selectedItem.ability = Utils.randomInt(0, 1);

                break;

            case 'weaponarcher':

                self.selectedItem.ability = Utils.randomInt(4, 5);

                break;

            case 'pendant':

                break;

            case 'ring':

                break;

            case 'boots':

                break;

        }

        self.selectedItem.abilityLevel = tier;

        _.each(Modules.Enchantment, (id, index) => {
            if (id === self.selectedItem.ability)
                self.player.notify(`Your item has been imbued with the ${index.toLowerCase()} ability.`);

        });

    }

    verify() {
        return Items.isEnchantable(this.selectedItem.id) && Items.isShard(this.selectedShards.id);
    }

    hasAbility(item) {
        return item.ability !== -1;
    }

}

module.exports = Enchant;
