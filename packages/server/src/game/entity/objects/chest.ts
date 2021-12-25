import Utils from '@kaetram/common/util/utils';
import Entity from '../entity';

import type Player from '../character/player/player';
import { Modules } from '@kaetram/common/network';

type OpenCallback = (player?: Player) => void;

export default class Chest extends Entity {
    private respawnDuration = 25_000;
    public static = false;

    private items: string[] = [];

    private openCallback?: OpenCallback;
    private respawnCallback?(): void;

    public constructor(x: number, y: number, public achievement?: number) {
        super(Utils.createInstance(Modules.EntityType.Chest), 'chest', x, y);
    }

    public addItems(items: string[]): void {
        this.items = items;
    }

    public openChest(player?: Player): void {
        this.openCallback?.(player);
    }

    public respawn(): void {
        setTimeout(() => {
            this.respawnCallback?.();
        }, this.respawnDuration);
    }

    public getItem(): { string: string; count: number } | null {
        let random = Utils.randomInt(0, this.items.length - 1),
            item = this.items[random],
            count = 1,
            probability = 100;

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

        if (Utils.randomInt(0, 100) > probability) return null;

        return {
            string: item,
            count
        };
    }

    public onOpen(callback: OpenCallback): void {
        this.openCallback = callback;
    }

    public onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }
}
