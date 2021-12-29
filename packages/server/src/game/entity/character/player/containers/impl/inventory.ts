import { Modules } from '@kaetram/common/network';

import Container from '../container';

export default class Inventory extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Inventory, size);
    }
}
