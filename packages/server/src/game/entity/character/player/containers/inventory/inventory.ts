import { Opcodes } from '@kaetram/common/network';

import Container from '../container';
import Constants from './constants';

import { Inventory as InventoryPacket, Notification } from '../../../../../../network/packets';

import type Item from '../../../../objects/item';
import type { ItemData } from '../../equipment/equipment';
import type Player from '../../player';

export default class Inventory extends Container {
    public constructor(owner: Player, size: number) {
        super('Inventory', owner, size);
    }

    public override load(
        ids: number[],
        counts: number[],
        abilities: number[],
        abilityLevels: number[]
    ): void {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new InventoryPacket(Opcodes.Inventory.Batch, [this.size, this.slots]));
    }

    public add(item: ItemData): boolean {
        if (!this.canHold(item.id!, item.count!)) {
            this.owner.send(
                new Notification(Opcodes.Notification.Text, {
                    message: Constants.InventoryFull
                })
            );
            return false;
        }

        let slot = this.addItem(item.id!, item.count!, item.ability!, item.abilityLevel!);

        if (!slot) return false;

        this.owner.send(new InventoryPacket(Opcodes.Inventory.Add, slot));

        this.owner.save();

        if (item.instance) this.owner.world.entities.removeItem(item as unknown as Item);

        return true;
    }

    public override remove(
        id: number | undefined,
        count: number | undefined,
        index?: number
    ): boolean {
        if (!id || !count) return false;

        if (!index) index = this.getIndex(id);

        if (!super.remove(index, id, count)) return false;

        this.owner.send(
            new InventoryPacket(Opcodes.Inventory.Remove, {
                index,
                count
            })
        );

        this.owner.save();

        return true;
    }
}
