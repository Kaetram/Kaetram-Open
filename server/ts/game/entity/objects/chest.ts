import Entity from '../entity';
import Utils from '../../../util/utils';

/**
 *
 */
class Chest extends Entity {
    public openCallback: any;

    public respawnCallback: any;

    public respawnDuration: any;

    public items: any;

    static: any;

    constructor(id, instance, x, y) {
        super(id, 'chest', instance, x, y);

        this.respawnDuration = 25000;
        this.static = false;

        this.items = [];
    }

    openChest() {
        if (this.openCallback) this.openCallback();
    }

    respawn() {
        setTimeout(() => {
            if (this.respawnCallback) this.respawnCallback();
        }, this.respawnDuration);
    }

    getItem() {
        const random = Utils.randomInt(0, this.items.length - 1);
        let item = this.items[random];
        let count = 1;
        let probability = 100;

        if (item.includes(':')) {
            const itemData = item.split(':');

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
            count
        };
    }

    onOpen(callback) {
        this.openCallback = callback;
    }

    onRespawn(callback) {
        this.respawnCallback = callback;
    }
}

export default Chest;
