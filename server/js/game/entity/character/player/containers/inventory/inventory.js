/* global module */

let _ = require('underscore'),
    Container = require('../container'),
    Messages = require('../../../../../../network/messages'),
    Packets = require('../../../../../../network/packets'),
    Constants = require('./constants'),
    Items = require('../../../../../../util/items');

class Inventory extends Container {

    constructor(owner, size) {
        super('Inventory', owner, size);
    }

    load(ids, counts, abilities, abilityLevels) {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Batch, [this.size, this.slots]));
    }

    add(item, count) {
        let self = this;

        if (!count)
            count = -1;

        if (count === -1)  //default to moving whole stack
            count = parseInt(item.count);

        if (!self.canHold(item.id, count)) {
            self.owner.send(new Messages.Notification(Packets.NotificationOpcode.Text, Constants.InventoryFull));
            return false;
        }

        let slot = super.add(item.id, count, item.ability, item.abilityLevel);

        if (!slot)
            return false;

        self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Add, slot));

        self.owner.save();

        if (item.instance)
            self.owner.world.removeItem(item);

        return true;
    }

    remove(id, count, index) {
        let self = this;

        if (!id || !count)
            return false;

        if (!index)
            index = self.getIndex(id);

        if (!super.remove(index, id, count))
            return false;

        self.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Remove, {
            index: parseInt(index),
            count: count
        }));

        self.owner.save();

        return true;
    }

}

module.exports = Inventory;
