/* global module */

const _ = require('underscore'),
    Container = require('../container'),
    Messages = require('../../../../../../network/messages'),
    Packets = require('../../../../../../network/packets'),
    Items = require('../../../../../../util/items');

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
        const self = this;

        if (!self.canHold(id, count)) {
            self.owner.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'You do not have enough space in your bank.'));
            return false;
        }

        const slot = super.add(id, parseInt(count), ability, abilityLevel);

        self.owner.send(new Messages.Bank(Packets.BankOpcode.Add, slot));
        self.owner.save();

        return true;
    }

    remove(id, count, index) {
        const self = this;

        if (!super.remove(index, id, count))
            return;

        self.owner.send(new Messages.Bank(Packets.BankOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));

        self.owner.save();
    }
}

module.exports = Bank;
