import { Opcodes } from '@kaetram/common/network';

import Messages from '../../../../../../network/messages';
import Container from '../container';

import type Player from '../../player';

interface BankInfo {
    id: number;
    count: number;
    ability: number;
    abilityLevel: number;
}

export default class Bank extends Container {
    public open = false;

    public constructor(owner: Player, size: number) {
        super('Bank', owner, size);
    }

    public override load(
        ids: number[],
        counts: number[],
        abilities: number[],
        abilityLevels: number[]
    ): void {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new Messages.Bank(Opcodes.Bank.Batch, [this.size, this.slots]));
    }

    public add(id: number, count: number, ability: number, abilityLevel: number): boolean {
        if (!this.canHold(id, count)) {
            this.owner.send(
                new Messages.Notification(Opcodes.Notification.Text, {
                    message: 'You do not have enough space in your bank.'
                })
            );

            return false;
        }

        let slot = this.addItem(id, count, ability, abilityLevel);

        this.owner.send(new Messages.Bank(Opcodes.Bank.Add, slot));
        this.owner.save();

        return true;
    }

    public override remove(id: number, count: number, index: number): boolean | undefined {
        if (!super.remove(index, id, count)) return false;

        this.owner.send(
            new Messages.Bank(Opcodes.Bank.Remove, {
                index,
                count
            })
        );

        this.owner.save();
    }

    /**
     * We return the slot data without the extra information.
     */
    public getInfo(index: number): BankInfo {
        let slot = this.slots[index];

        return {
            id: slot.id,
            count: slot.count,
            ability: slot.ability,
            abilityLevel: slot.abilityLevel
        };
    }
}
