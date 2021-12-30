import { Modules } from '@kaetram/common/network';
import Item from '../../../../objects/item';

import Container from '../container';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }

    public override add(item: Item): boolean {
        console.log(`item: ${item.key} - x: ${item.x} - y: ${item.y}`);

        if (!super.add(item)) this.notifyCallback?.('Could not add item to the inventory lol.');

        item.despawn(true);

        return true;
    }
}
