import Packets from '@kaetram/common/src/packets';

import Messages from '../../../../../../network/messages';
import Player from '../../player';
import Container from '../container';

interface BankInfo {
    id: number;
    count: number;
    ability: number;
    abilityLevel: number;
}

export default class Bank extends Container {
    public open: boolean;

    constructor(owner: Player, size: number) {
        super('Bank', owner, size);

        this.open = false;
    }

    override load(
        ids: number[],
        counts: number[],
        abilities: number[],
        abilityLevels: number[]
    ): void {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Batch, [this.size, this.slots]));
    }

    add(id: number, count: number, ability: number, abilityLevel: number): boolean {
        if (!this.canHold(id, count)) {
            this.owner.send(
                new Messages.Notification(Packets.NotificationOpcode.Text, {
                    message: 'You do not have enough space in your bank.'
                })
            );

            return false;
        }

        let slot = this.addItem(id, count, ability, abilityLevel);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Add, slot));
        this.owner.save();

        return true;
    }

    override remove(id: number, count: number, index: number): boolean {
        if (!super.remove(index, id, count)) return false;

        this.owner.send(
            new Messages.Bank(Packets.BankOpcode.Remove, {
                index,
                count
            })
        );

        this.owner.save();
    }

    /**
     * We return the slot data without the extra information.
     */

    getInfo(index: number): BankInfo {
        let slot = this.slots[index];

        return {
            id: slot.id,
            count: slot.count,
            ability: slot.ability,
            abilityLevel: slot.abilityLevel
        };
    }
}
