import Entity from '../entity';
import Player from '../character/player/player';
import Utils from '../../../util/utils';

class Chest extends Entity {
    respawnDuration: number;
    static: boolean;

    items: any;
    achievement: string;

    openCallback: Function;
    respawnCallback: Function;

    constructor(id: number, instance: string, x: number, y: number, achievement?: string) {
        super(id, 'chest', instance, x, y);

        this.respawnDuration = 25000;
        this.static = false;

        this.achievement = achievement;

        this.items = [];
    }

    addItems(items: string) {
        this.items = items.split(',');
    }

    openChest(player?: Player) {
        if (this.openCallback) this.openCallback(player);
    }

    respawn() {
        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnDuration);
    }

    getItem() {
        let random = Utils.randomInt(0, this.items.length - 1),
            item = this.items[random],
            count = 1,
            probability = 100;

        if (item.includes(':')) {
            let itemData = item.split(':');

            item = itemData.shift(); // name
            count = parseInt(itemData.shift()); // count
            probability = parseInt(itemData.shift()); // probability
        }

        /**
         * We must ensure an item is always present in order
         * to avoid any unforeseen circumstances.
         */
        if (!item) return null;

        if (Utils.randomInt(0, 100) > probability) return null;

        return {
            string: item,
            count: count
        };
    }

    onOpen(callback: Function) {
        this.openCallback = callback;
    }

    onRespawn(callback: Function) {
        this.respawnCallback = callback;
    }
}

export default Chest;
