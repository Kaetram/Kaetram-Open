import Entity from '../entity';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules, Opcodes } from '@kaetram/common/network';
import { LootBagPacket } from '@kaetram/common/network/impl';

import type Item from './item';
import type Player from '../character/player/player';
import type { SlotData } from '@kaetram/common/types/slot';
import type World from '../../world';

/**
 * The loot bag functions similarly to an item, it drops on the ground and floats.
 * When the player attempts to 'pick it up', it will open the loot bag instead
 * and allow the player to take items from it. The loot bag contains a mini
 * container where items can only be removed from, not added to. When the
 * loot bag is empty, it will disappear. Note that the loot bag on the client side
 * is regarded as an item, on the server-side I've opted to make it a separate object
 * in order to avoid inheritance of many unnecessary properties and variables.
 */

export default class LootBag extends Entity {
    private container: { [index: number]: Item | undefined } = {};

    private emptyCallback?: () => void;

    private blinkTimeout?: NodeJS.Timeout | undefined;
    private destroyTimeout?: NodeJS.Timeout | undefined;

    public constructor(
        private world: World,
        x: number,
        y: number,
        public owner: string,
        items: Item[]
    ) {
        super(Utils.createInstance(Modules.EntityType.LootBag), 'lootbag', x, y);

        // Iterate through the items and add them to the loot bag.
        for (let i = 0; i < items.length; i++) this.container[i] = items[i];

        // Begin the destroying timer.
        this.timer();
    }

    /**
     * Removes all the timeouts and creates a callback to
     * remove the entity from the world.
     */

    private destroy(): void {
        this.close();

        // Clear the timeouts.
        clearTimeout(this.blinkTimeout!);
        clearTimeout(this.destroyTimeout!);

        this.blinkTimeout = undefined;
        this.destroyTimeout = undefined;

        this.emptyCallback?.();
    }

    /**
     * Begins the blinking process for the loot bag. The loot bag is available for
     * a certain amount of time before it disappears. After the loot bag starts
     * blinking, it is free to be accessed by any player.
     */

    private timer(): void {
        this.blinkTimeout = setTimeout(() => {
            this.blinkTimeout = undefined;
            this.owner = '';

            this.destroyTimeout = setTimeout(() => {
                this.destroyTimeout = undefined;

                this.destroy();
            }, Modules.ItemDefaults.DESPAWN_DURATION);
        }, Modules.ItemDefaults.BLINK_DELAY);
    }

    /**
     * Opens the loot bag for the player and displays all the items. This
     * essentially opens an interface similar to the trade interface where
     * the player can take items from the loot bag.
     * @param player The player that is opening the loot bag, who we're
     * sending the packet to.
     */

    public open(player: Player): void {
        // Prevent cheating and packet manipulation.
        if (this.getDistance(player) > 1)
            return log.warning(
                `open(): Player ${player.username} tried to open a loot bag that was too far away.`
            );

        player.activeLootBag = this.instance;

        player.send(
            new LootBagPacket(Opcodes.LootBag.Open, {
                items: this.getItems()
            })
        );
    }

    /**
     * Takes an item from the loot bag and relays that information
     * to the clients nearby.
     * @param player The player that is taking the item.
     * @param index The index of the item in the loot bag container that the
     * player is requesting to take.
     */

    public take(player: Player, index: number, count = 1): void {
        if (this.instance !== player.activeLootBag)
            return log.warning(
                `Player ${player.username} tried to take an item from a loot bag without opening it.`
            );

        // Double check that the player has access to the loot bag.
        if (!this.isOwner(player.username)) return player.notify(`item:CANNOT_ACCESS_LOOTBAG`);

        // Verify that the player is close enough to the lootbag.
        if (this.getDistance(player) > 1)
            return log.warning(
                `take(): Player ${player.username} tried to take an item from a loot bag that was too far away.`
            );

        let item = this.container[index];

        // This is to prevent taking items at the same time/that don't exist.
        if (!item) return;

        /**
         * This is another layer of checking to prevent players from taking items
         * from the loot bag. First and foremost we don't let players open the
         * loot bag menu before we even get to this point. This is a failsafe.
         */

        if (this.owner && this.owner !== player.username)
            return player.notify(`item:CANNOT_ACCESS_LOOTBAG`);

        // Ensure the player has enough space in their inventory.
        if (!player.inventory.hasSpace()) return player.notify(`misc:NO_SPACE`);

        // Removes the item from the loot bag.
        delete this.container[index];

        // Add the item to the player's inventory.
        player.inventory.add(item);

        // Destroy the loot bag if it is empty.
        if (this.isEmpty()) this.destroy();
        else this.sendTakePacket(index);
    }

    /**
     * Sends a packet to all the players nearby (who may have the loot bag open)
     * to close the loot bag interface.
     * @param player The player about which we are sending the packet.
     */

    public close(): void {
        this.world.network.sendToSurroundingRegions(
            this.region,
            new LootBagPacket(Opcodes.LootBag.Close, {})
        );
    }

    /**
     * Sends a packet to the nearby regions of the loot bag regarding
     * which item in the lootbag was taken.
     * @param index The index of the lootbag item that was taken.
     */

    public sendTakePacket(index: number): void {
        this.world.network.sendToSurroundingRegions(
            this.region,
            new LootBagPacket(Opcodes.LootBag.Take, { index })
        );
    }

    /**
     * Used to limit actions to the owner of the loot bag. If no owner
     * is set then the loot bag is freely accessible from any player.
     * @param username The username of the owner of the loot bag.
     * @returns Whether or not the player is the owner of the loot bag.
     */

    public isOwner(username: string): boolean {
        if (!this.owner) return true;

        return this.owner === username;
    }

    /**
     * Used to determine if the loot bag's items have been taken.
     * @returns Whether or not the loot bag contains any items in its container.
     */

    private isEmpty(): boolean {
        return Object.keys(this.container).length === 0;
    }

    /**
     * Obtains the list of items in a simple array format that is then
     * read by the client and displayed in the loot bag menu. We convert
     * each item to a simple SlotData object.
     * @returns The list of items in the loot bag in the SlotData format.
     */

    private getItems(): SlotData[] {
        let items: SlotData[] = [];

        for (let i in this.container) {
            let item = this.container[i];

            if (!item) continue;

            items.push({
                index: parseInt(i),
                key: item.key,
                count: item.count,
                enchantments: item.enchantments
            });
        }

        return items;
    }

    /**
     * Callback for when the loot bag has been emptied. Used for
     * removing the entity from the world and relaying that
     * information to the clients nearby.
     */

    public onEmpty(callback: () => void): void {
        this.emptyCallback = callback;
    }
}
