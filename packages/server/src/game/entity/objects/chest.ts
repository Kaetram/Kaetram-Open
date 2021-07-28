import Utils from '../../../util/utils';
import Player from '../character/player/player';
import Entity from '../entity';

type OpenCallback = (player?: Player) => void;

export default class Chest extends Entity {
    respawnDuration: number;
    static: boolean;

    items: string[];
    achievement?: number;

    openCallback?: OpenCallback;
    respawnCallback?(): void;

    constructor(id: number, instance: string, x: number, y: number, achievement?: number) {
        super(id, 'chest', instance, x, y);

        this.respawnDuration = 25000;
        this.static = false;

        this.achievement = achievement;

        this.items = [];
    }

    addItems(items: string[]): void {
        this.items = items;
    }

    openChest(player?: Player): void {
        if (this.openCallback) this.openCallback(player);
    }

    respawn(): void {
        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnDuration);
    }

    getItem(): { string: string; count: number } | null {
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

    onOpen(callback: OpenCallback): void {
        this.openCallback = callback;
    }

    onRespawn(callback: () => void): void {
        this.respawnCallback = callback;
    }
}
