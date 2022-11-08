import World from '../game/world';

import Item from '../game/entity/objects/item';
import Player from '../game/entity/character/player/player';

import { Modules } from '@kaetram/common/network';

export default class Enchanter {
    public constructor(private world: World) {}

    public enchant(player: Player): void {
        //
    }

    /**
     * Adds an enchantment to an item.
     * @param item The item we are adding an enchantment onto.
     */

    private add(item: Item, id: Modules.Enchantment, level: number): void {
        // If an enchantment already exists, just update the level.
        if (id in item.enchantments && item.enchantments[id].level < level) {
            item.enchantments[id].level = level;
            return;
        }

        // Add the enchantment to the dictionary
        item.enchantments[id] = {
            level
        };
    }
}
