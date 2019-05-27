define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, inventoryContainer, size) {
            var self = this;

            self.game = game;
            self.inventoryContainer = inventoryContainer;

            self.player = game.player;

            self.body = $('#bank');
            self.bankSlots = $('#bankSlots');
            self.bankInventorySlots = $('#bankInventorySlots');

            self.container = new Container(size);
            self.close = $('#closeBank');

            self.close.css('left', '97%');
            self.close.click(function() {
                self.hide();
            });
        },

        load: function(data) {
            var self = this,
                bankList = self.bankSlots.find('ul'),
                inventoryList = self.bankInventorySlots.find('ul');

            for (var i = 0; i < data.length; i++) {
                var item = data[i],
                    slot = $('<div id="bankSlot' + i + '" class="bankSlot"></div>');

                self.container.setSlot(i, item);

                slot.css({
                    'margin-right': (2 * self.getScale()) + 'px',
                    'margin-bottom': (4 * self.getScale()) + 'px'
                });

                var image = $('<div id="bankImage' + i + '" class="bankImage"></div>');

                if (item.string)
                    image.css('background-image', self.container.getImageFormat(self.getDrawingScale(), item.string));

                slot.click(function(event) {
                    self.click('bank', event);
                });

                if (self.game.app.isMobile())
                    image.css('background-size', '600%');

                slot.append(image);
                slot.append('<div id="bankItemCount' + i + '" class="itemCount">' + (item.count > 1 ? item.count : '') + '</div>');

                slot.find('#bankItemCount' + i).css({
                    'font-size': (4 * self.getScale()) + 'px',
                    'margin-top': '0',
                    'margin-left': '0'
                });

                var bankListItem = $('<li></li>');

                bankListItem.append(slot);

                bankList.append(bankListItem);
            }

            for (var j = 0; j < self.inventoryContainer.size; j++) {
                var iItem = self.inventoryContainer.slots[j],
                    iSlot = $('<div id="bankInventorySlot' + j + '" class="bankSlot"></div>');

                iSlot.css({
                    'margin-right': (3 * self.getScale()) + 'px',
                    'margin-bottom': (6 * self.getScale()) + 'px'
                });

                var slotImage = $('<div id="inventoryImage' + j + '" class="bankImage"></div>');

                if (iItem.string)
                    slotImage.css('background-image', self.container.getImageFormat(self.getDrawingScale(), iItem.string));

                iSlot.click(function(event) {
                    self.click('inventory', event);
                });

                if (self.game.app.isMobile())
                    slotImage.css('background-size', '600%');

                iSlot.append(slotImage);
                iSlot.append('<div id="inventoryItemCount' + j + '" class="itemCount">' + (iItem.count > 1 ? iItem.count : '') + '</div>');

                iSlot.find('#inventoryItemCount' + j).css({
                    'margin-top': '0',
                    'margin-left': '0'
                });

                var inventoryListItem = $('<li></li>');

                inventoryListItem.append(iSlot);

                inventoryList.append(inventoryListItem);
            }
        },

        resize: function() {
            var self = this,
                bankList = self.getBankList(),
                inventoryList = self.getInventoryList();

            for (var i = 0; i < bankList.length; i++) {
                var bankSlot = $(bankList[i]).find('#bankSlot' + i),
                    image = bankSlot.find('#bankImage' + i),
                    slot = self.container.slots[i];

                bankSlot.css({
                    'margin-right': (2 * self.getScale()) + 'px',
                    'margin-bottom': (4 * self.getScale()) + 'px'
                });

                bankSlot.find('#bankItemCount' + i).css({
                    'font-size': (4 * self.getScale()) + 'px',
                    'margin-top': '0',
                    'margin-left': '0'
                });

                if (self.game.app.isMobile())
                    image.css('background-size', '600%');
                else
                    image.css('background-image', self.container.getImageFormat(self.getDrawingScale(), slot.string));
            }

            for (var j = 0; j < inventoryList.length; j++) {
                var inventorySlot = $(inventoryList[j]).find('#bankInventorySlot' + j),
                    iImage = inventorySlot.find('#inventoryImage' + j),
                    iSlot = self.inventoryContainer.slots[j];

                inventorySlot.css({
                    'margin-right': (3 * self.getScale()) + 'px',
                    'margin-bottom': (6 * self.getScale()) + 'px'
                });

                if (self.game.app.isMobile())
                    iImage.css('background-size', '600%');
                else
                    iImage.css('background-image', self.container.getImageFormat(self.getDrawingScale(), iSlot.string));
            }

        },

        click: function(type, event) {
            var self = this,
                isBank = type === 'bank',
                index = event.currentTarget.id.substring(isBank ? 8 : 17);

            self.game.socket.send(Packets.Bank, [Packets.BankOpcode.Select, type, index]);
        },

        add: function(info) {
            var self = this,
                item = $(self.getBankList()[info.index]),
                slot = self.container.slots[info.index];
            
            if (!item || !slot)
                return;

            if (slot.isEmpty())
                slot.load(info.string, info.count, info.ability, info.abilityLevel);

            slot.setCount(info.count);

            var bankSlot = item.find('#bankSlot' + info.index),
                cssSlot = bankSlot.find('#bankImage' + info.index),
                count = bankSlot.find('#bankItemCount' + info.index);

            cssSlot.css('background-image', self.container.getImageFormat(self.getDrawingScale(), info.string));

            if (self.game.app.isMobile())
                cssSlot.css('background-size', '600%');

            if (slot.count > 1)
                count.text(slot.count)
        },

        remove: function(info) {
            var self = this,
                item = $(self.getBankList()[info.index]),
                slot = self.container.slots[info.index];
            
            if (!item || !slot)
                return;
            
            slot.count -= info.count;
            
            if (slot.count < 1) {
                var divItem = item.find('#bankSlot' + info.index);

                divItem.find('#bankImage' + info.index).css('background-image', '');
                divItem.find('#bankItemCount' + info.index).text('');

                slot.empty();
            }
        },

        addInventory: function(info) {
            var self = this,
                item = $(self.getInventoryList()[info.index]);
            
            if (!item)
                return;
            
            var slot = item.find('#bankInventorySlot' + info.index),
                image = slot.find('#inventoryImage' + info.index);
            
            image.css('background-image', self.container.getImageFormat(self.getDrawingScale(), info.string));

            if (self.game.app.isMobile())
                image.css('background-size', '600%');

            if (info.count > 1)
                slot.find('#inventoryItemCount' + info.index).text(info.count);

        },

        removeInventory: function(info) {
            var self = this,
                item = $(self.getInventoryList()[info.index]);

            if (!item)
                return;

            var slot = item.find('#bankInventorySlot' + info.index);

            slot.find('#inventoryImage' + info.index).css('background-image', '');
            slot.find('#inventoryItemCount' + info.index).text('');
        },

        display: function() {
            this.body.fadeIn('slow');
        },

        hide: function() {
            this.body.fadeOut('fast');
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        getDrawingScale: function() {
            return this.game.renderer.getDrawingScale();
        },

        getScale: function() {
            return this.game.getScaleFactor();
        },

        getBankList: function() {
            return this.bankSlots.find('ul').find('li');
        },

        getInventoryList: function() {
            return this.bankInventorySlots.find('ul').find('li');
        }

    });

});