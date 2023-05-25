import Item from '../game/entity/objects/item';
import CraftingData from '../../data/crafting.json';
import Items from '../../data/items.json';

import Utils from '@kaetram/common/util/utils';
import CraftingEn from '@kaetram/common/text/en/crafting';
import { Modules, Opcodes } from '@kaetram/common/network';
import { Crafting as CraftingPacket } from '@kaetram/common/network/impl';

import type Player from '../game/entity/character/player/player';
import type { CraftingInfo } from '@kaetram/common/types/crafting';
import type { ItemData } from '@kaetram/common/types/item';

/**
 * The crafting mechanism is shared by multiple skills and works largely the same way. We use
 * the data from the crafting JSON to extract the available keys that the player can use to craft,
 * fletch, cook, smith.
 */

interface RawData {
    [key: string]: ItemData;
}
export default class Crafting {
    /**
     * Opens the crafting interface for a player given a specified skill.
     * @param player The player that is trying to open the crafting interface.
     * @param type The skill type we are trying to open the crafting interface for.
     */

    public open(player: Player, type: Modules.Skills): void {
        // Attempt to obtain the keys and if none are available then we cannot open the interface.
        let keys = this.getCraftingKeys(type);

        if (!keys) return player.notify(`You cannot do that right now.`);

        // Set the currently active crafting interface.
        player.activeCraftingInterface = type;

        // Send a packet to the client to open the crafting interface and pass the keys.
        player.send(
            new CraftingPacket(Opcodes.Crafting.Open, {
                type,
                keys
            })
        );
    }

    /**
     * Handles selecting an item to craft. This is one of the items from
     * the crafting keys that was sent to the player. Selecting an item sends
     * the requirements and the result to the player.
     * @param player The player who is selecting the item to craft.
     * @param key The string key of the item the player wishes to craft.
     */

    public select(player: Player, key: string): void {
        // Get the crafting item based on the index.
        let skillName = Modules.Skills[player.activeCraftingInterface].toLowerCase(),
            craftingData = (CraftingData as CraftingInfo)[skillName];

        // Another layer of checking the validity of the crafting data.
        if (!craftingData)
            return player.notify(`Invalid crafting data, please submit a bug report.`);

        // Get the item key from the crafting keys based on the index the player selected.
        let craftingItem = craftingData[key];

        // Ensure that the item exists.
        if (!craftingItem) return player.notify(`Invalid item selected...`);

        // Send the requirements and result to the player.
        player.send(
            new CraftingPacket(Opcodes.Crafting.Select, {
                key,
                name: (Items as RawData)[key]?.name,
                level: craftingItem.level,
                result: craftingItem.result.count,
                requirements: craftingItem.requirements
            })
        );
    }

    /**
     * Handles clicking the craft button. Based on the user's selection, we will craft
     * the item if the player has the correct requirements in his inventory.
     * @param player The player who is trying to craft the item.
     * @param key The key of the item to craft.
     * @param count The amount selected of an item to craft, defaults to 1.
     */

    public craft(player: Player, key: string, count = 1): void {
        // Prevent players from spamming the craft menu.
        if (!player.canCraft()) return;

        // Ensure the index is valid.
        if (!key) return player.notify(`You must select an item to craft.`);

        // Verify that the count is valid.
        if (isNaN(count) || count < 1) count = 1;

        let skillName = Modules.Skills[player.activeCraftingInterface].toLowerCase(),
            craftingData = (CraftingData as CraftingInfo)[skillName];

        // Verify the crafting data
        if (!craftingData)
            return player.notify(`Invalid crafting data, please submit a bug report.`);

        // The skill that is being used to craft the item.
        let craftingItem = craftingData[key],
            skill = player.skills.get(
                player.activeCraftingInterface === Modules.Skills.Smelting
                    ? Modules.Skills.Smithing
                    : player.activeCraftingInterface
            );

        // Verify the crafting data
        if (!craftingItem) return player.notify(`Invalid item selected...`);

        // Ensure the player has the correct level to craft the item.
        if (skill.level < craftingItem.level)
            return player.notify(
                CraftingEn.INVALID_LEVEL(player.activeCraftingInterface, craftingItem.level)
            );

        /**
         * The actual count refers to the maximum amount of items that the player can craft. So if
         * the player requests to craft 5x of an item, but they only have 3x of the requirements,
         * then the actual count will be 3x. This is to prevent the player from crafting more items
         * than they have the requirements for.
         */

        let actualCount = count;

        // Calculate the amount of each requirement we can take from the player's inventory.
        for (let requirement of craftingItem.requirements) {
            // Stop the loop if the player does not have one of the requirements.
            if (!player.inventory.hasItem(requirement.key, requirement.count))
                return player.notify(`You do not have the required items to craft that.`);

            let itemCount = player.inventory.count(requirement.key),
                requestedAmount = requirement.count * count;

            // Requested amount is greater than the amount of items the player has.
            if (requestedAmount > itemCount)
                actualCount = Math.floor(itemCount / requirement.count);
        }

        // Remove the items from the player's inventory.
        for (let requirement of craftingItem.requirements)
            player.inventory.removeItem(requirement.key, requirement.count * actualCount);

        let failures = 0;

        // Roll the random chance for every count of the item.
        for (let i = 0; i < actualCount; i++)
            if (Utils.randomInt(0, 100) > (craftingItem.chance || 100) + skill.level) failures++;

        // Remove the amount of failures from the actual count.
        actualCount -= failures;

        // Notify the players of the amount of failures.
        if (failures > 0)
            player.notify(`You have failed to craft ${failures}x ${(Items as RawData)[key].name}.`);

        // Award experience to the player.
        skill.addExperience(craftingItem.experience * actualCount);

        // Add the crafted item to the player's inventory.
        player.inventory.add(new Item(key, -1, -1, false, craftingItem.result.count * actualCount));
    }

    /**
     * Returns a list of the keys of items available for crafting given a skill.
     * @param skill The skill to get the crafting keys for.
     * @returns An array of item keys that the player can craft.
     */

    public getCraftingKeys(skill: Modules.Skills): string[] {
        // Skill name based on the enum.
        let skillName = Modules.Skills[skill].toLowerCase();

        return Object.keys((CraftingData as CraftingInfo)[skillName]);
    }
}
