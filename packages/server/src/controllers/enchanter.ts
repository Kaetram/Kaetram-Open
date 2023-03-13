import type World from '../game/world';
import type Player from '../game/entity/character/player/player';

export default class Enchanter {
    public constructor(private world: World) {}

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
            return player.notify(`You have not selected an item to enchant.`);

        // Attempt to grab the items from the inventory and verify that they exist.
        let itemSlot = player.inventory.get(index),
            shardSlot = player.inventory.get(shardIndex);

        // Ensure the slot element has an item before creating an item instance.
        if (!itemSlot?.key || !shardSlot?.key)
            return player.notify(`The item you have selected cannot be enchanted.`);

        // Ensure the player is providing shards to enchant an item.
        if (!shardSlot.key.startsWith('shardt'))
            return player.notify(`You must provide a shard to enchant an item.`);

        // Item instance that we can manipulate and do checking on.
        let item = player.inventory.getItem(itemSlot);

        // No enchantments available means the item cannot be enchanted.
        if (item.getAvailableEnchantments().length === 0)
            return player.notify(`This item cannot be enchanted.`);

        // Get the shard tier by removing the `shardt` prefix from the shard key.
        let tier = parseInt(shardSlot.key.split('shardt')[1]);

        console.log(tier);
    }
}
