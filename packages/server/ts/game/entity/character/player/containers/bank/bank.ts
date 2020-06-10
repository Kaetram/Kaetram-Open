/* global module */

import _ from 'underscore';
import Container from '../container';
import Messages from '../../../../../../network/messages';
import Packets from '../../../../../../network/packets';
import Items from '../../../../../../util/items';

class Bank extends Container {

    constructor(owner, size) {
        super('Bank', owner, size);

        this.open = false;
    }

    load(ids, counts, abilities, abilityLevels) {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Batch, [this.size, this.slots]));
    }

    add(id, count, ability, abilityLevel) {

        if (!this.canHold(id, count)) {
            this.owner.send(new Messages.Notification(Packets.NotificationOpcode.Text, {
                message: 'You do not have enough space in your bank.'
            }));
            return false;
        }

        let slot = super.add(id, parseInt(count), ability, abilityLevel);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Add, slot));
        this.owner.save();

        return true;
    }

    remove(id, count, index) {

        if (!super.remove(index, id, count))
            return;

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));

        this.owner.save();
    }


    /**
     * We return the slot data without the extra information.
     */

    getInfo(index) {
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
