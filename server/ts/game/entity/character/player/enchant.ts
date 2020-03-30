import * as _ from 'underscore';
import Items from '../../../../util/items';
import Messages from '../../../../network/messages';
import Packets from '../../../../network/packets';
import Utils from '../../../../util/utils';
import Modules from '../../../../util/modules';
import Player from './player';

/**
 *
 */
class Enchant {
    public selectedItem: any;

    public selectedShards: any;

    public player: Player;

    /**
     * Tier 1 - Damage/Armour boost (1-5%)
     * Tier 2 - Damage boost (1-10% & 10% for special ability or special ability level up)
     * Tier 3 - Damage boost (1-15% & 15% for special ability or special ability level up)
     * Tier 4 - Damage boost (1-20% & 20% for special ability or special ability level up)
     * Tier 5 - Damage boost (1-25% & 25% for special ability or special ability level up)
     */

    constructor(player) {
        this.player = player;

        this.selectedItem = null;
        this.selectedShards = null;
    }

    add(type, item) {
        const isItem = item === 'item';

        if (isItem && !Items.isEnchantable(item.id)) return;

        if (type === 'item') {
            if (this.selectedItem) this.remove('item');

            this.selectedItem = item;
        } else if (type === 'shards') {
            if (this.selectedShards) this.remove('shards');

            this.selectedShards = item;
        }

        this.player.send(
            new Messages.Enchant(Packets.EnchantOpcode.Select, {
                type,
                index: item.index
            })
        );
    }

    remove(type) {
        let index = -1;

        if (type === 'item' && this.selectedItem) {
            index = this.selectedItem.index;

            this.selectedItem = null;
        } else if (type === 'shards' && this.selectedShards) {
            index = this.selectedShards.index;

            this.selectedShards = null;
        }

        if (index < 0) return;

        this.player.send(
            new Messages.Enchant(Packets.EnchantOpcode.Remove, {
                type,
                index
            })
        );
    }

    convert(shard) {
        if (!Items.isShard(shard.id) || !this.player.inventory.hasSpace())
            return;

        const tier = Items.getShardTier(shard.id);

        if (shard.count < 11 && tier > 5) return;

        for (let i = 0; i < shard.count; i += 10) {
            this.player.inventory.remove(shard.id, 10, shard.index);

            this.player.inventory.add({
                id: shard.id + 1,
                count: 1,
                ability: -1,
                abilityLevel: -1
            });
        }
    }

    enchant() {
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
            this.player.notify(
                'You must have a minimum of 10 shards to enchant.'
            );

            return;
        }

        /**
         * Implement probabilities here based on the number of shards
         * and reason them out.
         */

        const tier = Items.getShardTier(this.selectedShards.id);

        if (tier < 1) return;

        if (tier <= this.selectedItem.abilityLevel) {
            this.player.notify(
                'This item has already been imbued with those shards.'
            );

            return;
        }

        this.generateAbility(tier);

        this.player.inventory.remove(
            this.selectedShards.id,
            10,
            this.selectedShards.index
        );

        this.remove('item');
        this.remove('shards');

        this.player.sync();
    }

    generateAbility(tier) {
        const type = Items.getType(this.selectedItem.id);
        const probability = Utils.randomInt(0, 100);

        if (probability > 20 + 5 * tier) {
            this.player.notify('The item has failed to enchant.');

            return;
        }

        console.info(
            `Selected item ability info: ${this.selectedItem.ability} + ${this.selectedItem.abilityLevel}.`
        );

        if (this.hasAbility(this.selectedItem)) {
            const abilityName = Object.keys(Modules.Enchantment)[
                this.selectedItem.ability
            ];

            this.selectedItem.abilityLevel = tier;

            this.player.notify(
                `Your item has been imbued with level ${tier} of the ${abilityName} ability.`
            );

            return;
        }

        switch (type) {
            case 'armor':
            case 'armorarcher':
                this.selectedItem.ability = Utils.randomInt(2, 3);

                break;

            case 'weapon':
                this.selectedItem.ability = Utils.randomInt(0, 1);

                break;

            case 'weaponarcher':
                this.selectedItem.ability = Utils.randomInt(4, 5);

                break;

            case 'pendant':
                break;

            case 'ring':
                break;

            case 'boots':
                break;
        }

        this.selectedItem.abilityLevel = tier;

        _.each(Modules.Enchantment, (id, index) => {
            if (id === this.selectedItem.ability)
                this.player.notify(
                    `Your item has been imbued with the ${index.toLowerCase()} ability.`
                );
        });
    }

    verify() {
        return (
            Items.isEnchantable(this.selectedItem.id) &&
            Items.isShard(this.selectedShards.id)
        );
    }

    hasAbility(item) {
        return item.ability !== -1;
    }
}

export default Enchant;
