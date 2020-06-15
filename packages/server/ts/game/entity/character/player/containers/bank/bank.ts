/* global module */

import _ from 'underscore';
import Container from '../container';
import Messages from '../../../../../../network/messages';
import Packets from '../../../../../../network/packets';
import Player from '../../player';

class Bank extends Container {

    public open: boolean;

    constructor(owner: Player, size: number) {
        super('Bank', owner, size);

        this.open = false;
    }

    load(ids: Array<number>, counts: Array<number>, abilities: Array<number>, abilityLevels: Array<number>) {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Batch, [this.size, this.slots]));
    }

    add(id: number, count: number, ability: number, abilityLevel: number) {

        if (!this.canHold(id, count)) {
            this.owner.send(new Messages.Notification(Packets.NotificationOpcode.Text, {
                message: 'You do not have enough space in your bank.'
            }));
            return false;
        }

        let slot = super.add(id, count, ability, abilityLevel);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Add, slot));
        this.owner.save();

        return true;
    }

    remove(id: number, count: number, index: number) {

        if (!super.remove(index, id, count))
            return;

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Remove, {
            index: index,
            count: count
        }));

        this.owner.save();
    }


    /**
     * We return the slot data without the extra information.
     */

    getInfo(index: number) {
        let slot = this.slots[index];

        return {
            id: slot.id,
            count: slot.count,
            ability: slot.ability,
            abilityLevel: slot.abilityLevel
        }
    }

}

export default Bank;
