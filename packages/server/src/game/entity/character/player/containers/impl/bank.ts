import { Modules } from '@kaetram/common/network';

import Container from '../container';

export default class Bank extends Container {
    public constructor(size: number) {
        super(Modules.ContainerType.Bank, size);
    }
}
