import { Modules } from '@kaetram/common/network';
import Item from '../../../../objects/item';

import Container from '../container';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }

    public override add(item: Item): boolean {
        if (!super.add(item)) {
            this.notifyCallback?.('There is not enough room in your inventory!');
            return false;
        }

        item.despawn(true);

        return true;
    }
}
