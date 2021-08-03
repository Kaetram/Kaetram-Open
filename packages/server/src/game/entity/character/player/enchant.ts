import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Messages from '../../../../network/messages';
import Items from '../../../../util/items';

import type Slot from './containers/slot';
import type Player from './player';

export type EnchantType = 'item' | 'shards';

export default class Enchant {
    /**
     * Tier 1 - Damage/Armour boost (1-5%)
     * Tier 2 - Damage boost (1-10% & 10% for special ability or special ability level up)
     * Tier 3 - Damage boost (1-15% & 15% for special ability or special ability level up)
     * Tier 4 - Damage boost (1-20% & 20% for special ability or special ability level up)
     * Tier 5 - Damage boost (1-25% & 25% for special ability or special ability level up)
     */

    private selectedItem!: Slot;
    private selectedShards!: Slot;

    public constructor(private player: Player) {}

    public add(type: EnchantType, item: Slot): void {
        if (type === 'item') {
            if (!Items.isEnchantable(item.id)) return;

            if (this.selectedItem) this.remove('item');

            this.selectedItem = item;
        } else if (type === 'shards') {
            if (this.selectedShards) this.remove('shards');

            this.selectedShards = item;
        }

        this.player.send(
            new Messages.Enchant(Opcodes.Enchant.Select, {
                type,
                index: item.index
            })
        );
    }

    public remove(type: EnchantType): void {
        let index = -1;

        if (type === 'item' && this.selectedItem) {
            ({ index } = this.selectedItem);

            this.selectedItem = null!;
        } else if (type === 'shards' && this.selectedShards) {
            ({ index } = this.selectedShards);

            this.selectedShards = null!;
        }

        if (index < 0) return;

        this.player.send(
            new Messages.Enchant(Opcodes.Enchant.Remove, {
                type,
                index
            })
        );
    }

    public convert(shard: Slot): void {
        if (!Items.isShard(shard.id) || !this.player.inventory.hasSpace()) return;

        let tier = Items.getShardTier(shard.id)!;

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

    public enchant(): void {
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

        let tier = Items.getShardTier(this.selectedShards.id)!;

        if (tier < 1) return;

        if (tier <= this.selectedItem.abilityLevel) {
            this.player.notify('This item has already been imbued with those shards.');

            return;
        }

        this.generateAbility(tier);

        this.player.inventory.remove(this.selectedShards.id, 10, this.selectedShards.index);

        this.remove('item');
        this.remove('shards');

        this.player.sync();
    }

    private generateAbility(tier: number): void {
        let type = Items.getType(this.selectedItem.id),
            probability = Utils.randomInt(0, 100);

        if (probability > 20 + 5 * tier) {
            this.player.notify('The item has failed to enchant.');
            return;
        }

        log.info(
            `Selected item ability info: ${this.selectedItem.ability} + ${this.selectedItem.abilityLevel}.`
        );

        if (this.hasAbility(this.selectedItem)) {
            let abilityName = Object.keys(Modules.Enchantment)[this.selectedItem.ability];

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

    private verify(): boolean {
        return Items.isEnchantable(this.selectedItem.id) && Items.isShard(this.selectedShards.id);
    }

    private hasAbility(item: Slot): boolean {
        return item.ability !== -1;
    }
}
