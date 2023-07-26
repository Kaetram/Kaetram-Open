import Formulas from '../info/formulas';

import Utils from '@kaetram/common/util/utils';
import { EnchantPacket } from '@kaetram/common/network/impl';
import { Opcodes } from '@kaetram/common/network';

import type Item from '../game/entity/objects/item';
import type Player from '../game/entity/character/player/player';

export default class Enchanter {
    /**
     * When a player selects an item we determine whether or not it can be enchanted. This
     * is the first step of the enchanting process.
     * @param player The player who is selecting an item.
     * @param index The index in the inventory of the item that is being selected.
     */

    public select(player: Player, index = -1) {
        // Prevent against packet manipulation.
        if (isNaN(index) || index === -1) return player.notify('enchant:CANNOT_ENCHANT');

        // Grab the slot at the index provided.
        let slot = player.inventory.get(index);

        // Preliminary checks for item validity.
        if (!slot?.key) return player.notify('enchant:CANNOT_ENCHANT');

        // Send a select packet to the client if the item is a shard.
        if (slot.key.startsWith('shardt'))
            return player.send(new EnchantPacket(Opcodes.Enchant.Select, { index, isShard: true }));

        // Check that the item is enchantable.
        if (slot.count > 1 || !slot.equippable || slot.maxStackSize > 1)
            return player.notify('enchant:CANNOT_ENCHANT');

        // Check that the item has available enchantments.
        if (player.inventory.getItem(slot).getAvailableEnchantments().length === 0)
            return player.notify('enchant:CANNOT_ENCHANT');

        // Send a select packet to the client.
        player.send(new EnchantPacket(Opcodes.Enchant.Select, { index }));
    }

    /**
     * Applies an enchantment on an item at a specified index in the player's inventory.
     * We use index in order to verify the integrity of the packet data.
     * @param player The player that is enchanting an item.
     * @param index The index of the item in the player's inventory.
     * @param shardIndex The index of the shard in the player's inventory.
     */

    public enchant(player: Player, index = -1, shardIndex = -1): void {
        // Prevent invalid data from being used.
        if (shardIndex === -1 || index === -1 || isNaN(index) || isNaN(shardIndex))
            return player.notify('enchant:NO_ITEM_SELECTED');

        // Attempt to grab the items from the inventory and verify that they exist.
        let itemSlot = player.inventory.get(index),
            shardSlot = player.inventory.get(shardIndex);

        // Ensure the slot element has an item before creating an item instance.
        if (!itemSlot?.key || !shardSlot?.key) return player.notify('enchant:NO_ITEM_SELECTED');

        // Ensure the player is providing shards to enchant an item.
        if (!shardSlot.key.startsWith('shardt')) return player.notify('enchant:NO_SHARD');

        // Item instance that we can manipulate and do checking on.
        let item = player.inventory.getItem(itemSlot).copy(),
            enchantments = item.getAvailableEnchantments();

        // No enchantments available means the item cannot be enchanted.
        if (enchantments.length === 0) return player.notify('enchant:NO_ITEM_SELECTED');

        // Get the shard tier by removing the `shardt` prefix from the shard key.
        let tier = parseInt(shardSlot.key.split('shardt')[1]),
            chance = Formulas.getEnchantChance(tier);

        // Remove one shard from the player's inventory.
        player.inventory.remove(shardIndex, 1);

        // Enchantment failed to apply.
        if (!chance) player.notify('enchant:FAILED_ENCHANT');

        /**
         * Pick out a random enchantment from the available enchantments and
         * roll against the tier of the shard to determine the likelihood of
         * a higher-level enchantment.
         */

        let enchantment = enchantments[Utils.randomInt(0, enchantments.length - 1)],
            level = Utils.randomInt(1, tier);

        if (!this.canEnchant(item, enchantment, level)) player.notify('enchant:FAILED_ENCHANT');

        // Apply the enchantment only if the level is greater or it doesn't exist.
        item.setEnchantment(enchantment, level);

        // Remove the item from the inventory and add the enchanted item.
        itemSlot.update(item);

        // Send a notification to the player.
        player.notify('enchant:SUCCESSFUL_ENCHANT');

        // Synchronize the inventory with the new slots.
        player.inventory.loadCallback?.();
    }

    /**
     * An item can only be enchanted if it doesn't have an active enchantment on it or
     * if the level of enchantment we are applying is greater than the current level.
     * @param item The item we are checking the enchantability of.
     * @param enchantment The enchantment id we are checking.
     * @param level The level of the enchantment we are checking.
     * @returns Whether or not this item can be enchanted.
     */

    private canEnchant(item: Item, enchantment: number, level: number): boolean {
        if (!item.hasEnchantment(enchantment)) return true;

        return level > item.getEnchantmentLevel(enchantment);
    }
}
