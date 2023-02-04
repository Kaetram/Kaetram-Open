import Container from '../container';

import { Modules } from '@kaetram/common/network';
import BankEn from '@kaetram/common/text/en/bank';

import type Item from '../../../../objects/item';

export default class Bank extends Container {
    protected override ignoreMaxStackSize = true;

    public constructor(size: number) {
        super(Modules.ContainerType.Bank, size);
    }

    /**
     * Override for the container `add` function where we send a notification.
     * @param item The item to add to the container.
     * @returns Whether or not the item was successfully added.
     */

    public override add(item: Item): number | undefined {
        let amount = super.add(item);

        if (!amount) {
            this.notifyCallback?.(BankEn.NOT_ENOUGH_SPACE);
            return;
        }

        return amount;
    }
}
