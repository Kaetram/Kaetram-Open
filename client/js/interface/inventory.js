/* global log, Detect, Packets */

define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, size) {
            var self = this;

            self.game = game;
            self.actions = game.interface.actions;

            self.body = $('#inventory');
            self.button = $('#inventoryButton');
            self.action = $('#actionContainer');

            self.container = new Container(size);

            self.activeClass = 'inventory';

            self.selectedSlot = null;
            self.selectedItem = null;
        },

        load: function(data) {
            var self = this,
                list = $('#inventory').find('ul');

            for (var i = 0; i < data.length; i++) {
                var item = data[i];

                self.container.setSlot(i, item);

                var itemSlot = $('<div id="slot' + i + '" class="itemSlot"></div>');

                if (item.string !== 'null')
                    itemSlot.css('background-image', self.container.getImageFormat(self.getScale(), item.string));

                itemSlot.css('background-size', '600%');

                itemSlot.dblclick(function(event) {
                    self.clickDouble(event);
                });

                itemSlot.click(function(event) {
                    self.click(event);
                });

                var itemSlotList = $('<li></li>'),
                    count = item.count;

                if (count > 999999)
                    count = count.toString().substring(0, count.toString().length - 6) + 'M';
                else if (count > 9999)
                    count = count.toString().substring(0, 2) + 'K';
                else if (count === 1)
                    count = '';

                itemSlotList.append(itemSlot);
                itemSlotList.append('<div id="itemCount' + i + '" class="inventoryItemCount">' + count + '</div>');

                list.append(itemSlotList);
            }

            self.button.click(function() {
                self.open();
            });
        },

        open: function() {
            var self = this;

            self.game.interface.hideAll();

            if (self.isVisible())
                self.hide();
            else
                self.display();

            self.game.socket.send(Packets.Click, ['inventory', self.button.hasClass('active')]);
        },

        click: function(event) {
            var self = this,
                index = event.currentTarget.id.substring(4),
                slot = self.container.slots[index],
                item = $(self.getList()[index]);

            self.clearSelection();

            if (slot.string === null || slot.count === -1 || slot.string === 'null')
                return;

            self.actions.loadDefaults('inventory');

            if (slot.edible)
                self.actions.add($('<div id="eat" class="actionButton">Eat</div>'));
            else if (slot.equippable)
                self.actions.add($('<div id="wield" class="actionButton">Wield</div>'));
            else if (slot.count > 999999)
                self.actions.add($('<div id="itemInfo" class="actionButton">Info</div>'));

            if (!self.actions.isVisible())
                self.actions.show();

            var sSlot = item.find('#slot' + index);

            sSlot.addClass('select');

            self.selectedSlot = sSlot;
            self.selectedItem = slot;

            self.actions.hideDrop();
        },

        clickDouble: function(event) {
            var self = this,
                index = event.currentTarget.id.substring(4),
                slot = self.container.slots[index];

            if (!slot.edible && !slot.equippable)
                return;

            var item = $(self.getList()[index]),
                sSlot = item.find('#slot' + index);

            self.clearSelection();

            self.selectedSlot = sSlot;
            self.selectedItem = slot;

            self.clickAction(slot.edible ? 'eat' : 'wield');

            self.actions.hideDrop();
        },

        clickAction: function(event, dAction) {
            var self = this,
                action = event.currentTarget ? event.currentTarget.id : event;

            if (!self.selectedSlot || !self.selectedItem)
                return;

            switch(action) {
                case 'eat':
                case 'wield':

                    self.game.socket.send(Packets.Inventory, [Packets.InventoryOpcode.Select, self.selectedItem.index]);
                    self.clearSelection();

                    break;

                case 'drop':
                    var item = self.selectedItem;

                    if (item.count > 1) {
                        if (Detect.isMobile())
                            self.hide(true);

                        self.actions.displayDrop('inventory');

                    } else {
                        self.game.socket.send(Packets.Inventory, [Packets.InventoryOpcode.Remove, item]);
                        self.clearSelection();
                    }

                    break;

                case 'dropAccept':

                    var count = $('#dropCount').val();

                    if (isNaN(count) || count < 1)
                        return;

                    self.game.socket.send(Packets.Inventory, [Packets.InventoryOpcode.Remove, self.selectedItem, count]);
                    self.actions.hideDrop();
                    self.clearSelection();

                    break;

                case 'dropCancel':

                    self.actions.hideDrop();
                    self.clearSelection();

                    break;

                case 'itemInfo':

                    self.game.input.chatHandler.add('WORLD', 'You have ' + self.selectedItem.count + ' coins.');

                    break;
            }

            self.actions.hide();
        },

        add: function(info) {
            var self = this,
                item = $(self.getList()[info.index]),
                slot = self.container.slots[info.index];

            if (!item || !slot)
                return;

            // Have the server forcefully load data into the slot.
            slot.load(info.string, info.count, info.ability, info.abilityLevel, info.edible, info.equippable);

            var cssSlot = item.find('#slot' + info.index);

            cssSlot.css('background-image', self.container.getImageFormat(self.getScale(), slot.string));

            cssSlot.css('background-size', '600%');

            var count = slot.count;

            if (count > 999999)
                count = count.toString().substring(0, count.toString().length - 6) + 'M';
            else if (count > 9999)
                count = count.toString().substring(0, 2) + 'K';
            else if (count === 1)
                count = '';

            item.find('#itemCount' + info.index).text(count);
        },

        remove: function(info) {
            var self = this,
                item = $(self.getList()[info.index]),
                slot = self.container.slots[info.index];

            if (!item || !slot)
                return;

            slot.count -= info.count;

            item.find('#itemCount' + info.index).text(slot.count);

            if (slot.count < 1) {
                item.find('#slot' + info.index).css('background-image', '');
                item.find('#itemCount' + info.index).text('');
                slot.empty();
            }
        },

        resize: function() {
            var self = this,
                list = self.getList();

            for (var i = 0; i < list.length; i++) {
                var item = $(list[i]).find('#slot' + i),
                    slot = self.container.slots[i];

                if (!slot)
                    continue;

                if (Detect.isMobile())
                    item.css('background-size', '600%');
                else
                    item.css('background-image', self.container.getImageFormat(self.getScale(), slot.string));
            }

        },

        clearSelection: function() {
            var self = this;

            if (!self.selectedSlot)
                return;

            self.selectedSlot.removeClass('select');
            self.selectedSlot = null;
            self.selectedItem = null;
        },

        display: function() {
            var self = this;

            self.body.fadeIn('fast');
            self.button.addClass('active');
        },

        hide: function(keepSelection) {
            var self = this;

            self.button.removeClass('active');

            self.body.fadeOut('slow');
            self.button.removeClass('active');

            if (!keepSelection)
                self.clearSelection();
        },

        clear: function() {
            var self = this;

            $('#inventory').find('ul').empty();

            if (self.button)
                self.button.unbind('click');
        },

        getScale: function() {
            return this.game.renderer.getScale();
        },

        getSize: function() {
            return this.container.size;
        },

        getList: function() {
            return $('#inventory').find('ul').find('li');
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        }

    });

});
