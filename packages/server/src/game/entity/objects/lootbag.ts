import Entity from '../entity';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Player from '../character/player/player';
import type Item from './item';

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

    public constructor(x: number, y: number, private owner: string, items: Item[]) {
        super(Utils.createInstance(Modules.EntityType.LootBag), 'lootbag', x, y);

        // Iterate through the items and add them to the loot bag.
        for (let i = 0; i < items.length; i++) this.container[i] = items[i];

        // Begin the destroying timer.
        this.timer();
    }

    private destroy(): void {
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
        //
    }

    /**
     * Takes an item from the loot bag and relays that information
     * to the clients nearby.
     * @param player The player that is taking the item.
     * @param index The index of the item in the loot bag container that the
     * player is requesting to take.
     */

    public take(player: Player, index: number): void {
        let item = this.container[index];

        // This is to prevent taking items at the same time/that don't exist.
        if (!item) return;

        /**
         * This is another layer of checking to prevent players from taking items
         * from the loot bag. First and foremost we don't let players open the
         * loot bag menu before we even get to this point. This is a failsafe.
         */

        if (this.owner && this.owner !== player.username)
            return player.notify(`You cannot access this loot bag right now.`);

        // Removes the item from the loot bag.
        delete this.container[index];

        // Add the item to the player's inventory.
        player.inventory.add(item);

        // Destroy the loot bag if it is empty.
        if (this.isEmpty()) this.destroy();
    }

    /**
     * Used to limit actions to the owner of the loot bag. If no owner
     * is set then the loot bag is freely accessible from any player.
     * @param instance The instance of the player that is attempting to
     * access the loot bag.
     * @returns Whether or not the player is the owner of the loot bag.
     */

    public isOwner(instance: string): boolean {
        if (!this.owner) return true;

        return this.owner === instance;
    }

    /**
     * Used to determine if the loot bag's items have been taken.
     * @returns Whether or not the loot bag contains any items in its container.
     */

    private isEmpty(): boolean {
        return Object.keys(this.container).length === 0;
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
