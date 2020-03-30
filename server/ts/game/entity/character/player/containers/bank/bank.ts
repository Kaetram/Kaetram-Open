import * as _ from 'underscore';
import Container from '../container';
import Messages from '../../../../../../network/messages';
import Packets from '../../../../../../network/packets';
import Items from '../../../../../../util/items';

/**
 *
 */
class Bank extends Container {
    public open: any;

    public owner: any;

    public size: any;

    public slots: any;

    public canHold: any;

    constructor(owner, size) {
        super('Bank', owner, size);

        this.open = false;
    }

    load(ids, counts, abilities, abilityLevels) {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(
            new Messages.Bank(Packets.BankOpcode.Batch, [this.size, this.slots])
        );
    }

    add(id, count, ability, abilityLevel) {
        if (!this.canHold(id, count)) {
            this.owner.send(
                new Messages.Notification(
                    Packets.NotificationOpcode.Text,
                    'You do not have enough space in your bank.'
                )
            );

            return false;
        }

        const slot = super.add(id, parseInt(count), ability, abilityLevel);

        this.owner.send(new Messages.Bank(Packets.BankOpcode.Add, slot));
        this.owner.save();

        return true;
    }

    remove(id, count, index): any {
        if (!super.remove(index, id, count)) return;

        this.owner.send(
            new Messages.Bank(Packets.BankOpcode.Remove, {
                index: parseInt(index),
                count
            })
        );

        this.owner.save();
    }
}

export default Bank;
