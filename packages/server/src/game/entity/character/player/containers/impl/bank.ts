import Container from '../container';

import { Modules } from '@kaetram/common/network';

export default class Bank extends Container {
    protected override ignoreMaxStackSize = true;

    public constructor(size: number) {
        super(Modules.ContainerType.Bank, size);
    }
}
