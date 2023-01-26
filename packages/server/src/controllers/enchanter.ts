import type { Modules } from '@kaetram/common/network';
import type Player from '../game/entity/character/player/player';
import type Item from '../game/entity/objects/item';
import type World from '../game/world';

export default class Enchanter {
    public constructor(private world: World) {}

    public enchant(_player: Player): void {
        //
    }

    /**
     * Adds an enchantment to an item.
     * @param item The item we are adding an enchantment onto.
     */

    private add(item: Item, id: Modules.Enchantment, level: number): boolean {
        // Skip if the enchantment is the same level.
        if (item.hasEnchantment(id) && item.enchantments[id].level === level) return false;

        item.setEnchantment(id, level);

        return true;
    }
}
