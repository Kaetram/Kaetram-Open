import Entity from '../entity';

import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type Player from '../character/player/player';

interface ItemDrop {
    key: string;
    count: number;
}
type OpenCallback = (player?: Player) => void;

export default class Chest extends Entity {
    // If the chest should respawn.
    public static = false;

    private respawnDuration = Modules.Constants.CHEST_RESPAWN;

    private openCallback?: OpenCallback;
    private respawnCallback?: () => void;

    public constructor(
        x: number,
        y: number,
        public achievement?: string,
        public mimic = false,
        private items: string[] = []
    ) {
        super(Utils.createInstance(Modules.EntityType.Chest), 'chest', x, y);
    }

    /**
     * Creates a chest callback.
     * @param player Optional parameter to be passed along with the callback.
     */

    public openChest(player?: Player): void {
        this.openCallback?.(player);
    }

    /**
     * Calls a respawn timeout.
     */

    public respawn(): void {
        setTimeout(this.respawnCallback!, this.respawnDuration);
    }

    /**
     * Grabs an item from the chest randomly. If a specific count
     * and probability are provided, it picks a random item, then rolls
     * against the specified probability to determine if the item should
     * be dropped.
     * @returns Item information if probability roll is successful, otherwise null.
     */

    public getItem(): ItemDrop | null {
        if (this.items.length === 0) return null;

        // Picks a random item from the list of items.
        let random = Utils.randomInt(0, this.items.length - 1),
            item = this.items[random],
            count = 1,
            probability = 100;

        // If the item has specified count and probability, we use that to determine drop rate.
        if (item.includes(':')) {
            let itemData = item.split(':');

            item = itemData.shift()!; // name
            count = parseInt(itemData.shift()!); // count
            probability = parseInt(itemData.shift()!); // probability
        }

        /**
         * We must ensure an item is always present in order
         * to avoid any unforeseen circumstances.
         */
        if (!item) return null;

        // Roll against the probability factor.
        if (Utils.randomInt(0, 100) > probability) return null;

        return {
            key: item,
            count
        };
    }

    /**
     * Callback for when the chest entity has been opened/toggled.
     * @param callback Contains the player object that opened the chest.
     */

    public onOpen(callback: OpenCallback): void {
        this.openCallback = callback;
    }

    /**
     * Callback for when the timeout for respawning the chest has been reached.
     */

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }
}
