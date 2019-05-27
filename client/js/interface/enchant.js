define(['jquery'], function($) {

    return Class.extend({

        init: function(game, intrface) {
            var self = this;

            self.game = game;
            self.interface = intrface;

            self.body = $('#enchant');
            self.container = $('#enchantContainer');
            self.enchantSlots = $('#enchantInventorySlots');

            self.selectedItem = $('#enchantSelectedItem');
            self.selectedShards = $('#enchantShards');
            self.confirm = $('#confirmEnchant');
            self.shardsCount = $('#shardsCount');

            self.confirm.css({
                'left': '70%',
                'top': '80%'
            });

            $('#closeEnchant').click(function() {
                self.hide();
            });

            self.confirm.click(function() {
                self.enchant();
            });
        },

        resize: function() {
            var self = this;

            self.load();
        },

        load: function() {
            var self = this,
                list = self.getSlots(),
                inventoryList = self.interface.bank.getInventoryList();

            list.empty();

            for (var i = 0; i < self.getInventorySize(); i++) {
                var item = $(inventoryList[i]).clone(),
                    slot = item.find('#bankInventorySlot' + i);

                slot.click(function(event) {
                    self.select(event);
                });

                list.append(item);
            }

            self.selectedItem.click(function() {
                self.remove('item');
            });

            self.selectedShards.click(function() {
                self.remove('shards');
            });

        },

        add: function(type, index) {
            var self = this,
                image = self.getSlot(index).find('#inventoryImage' + index);

            switch (type) {
                case 'item':

                    self.selectedItem.css('background-image', image.css('background-image'));

                    if (self.game.app.isMobile())
                        self.selectedItem.css('background-size', '600%');

                    break;

                case 'shards':

                    self.selectedShards.css('background-image', image.css('background-image'));

                    if (self.game.app.isMobile())
                        self.selectedShards.css('background-size', '600%');

                    var count = self.getItemSlot(index).count;

                    if (count > 1)
                        self.shardsCount.text(count);

                    break;
            }

            image.css('background-image', '');

            self.getSlot(index).find('#inventoryItemCount' + index).text('');
        },

        moveBack: function(type, index) {
            var self = this,
                image = self.getSlot(index).find('#inventoryImage'+ index),
                itemCount = self.getSlot(index).find('#inventoryItemCount' + index),
                count = self.getItemSlot(index).count;

            switch (type) {
                case 'item':

                    image.css('background-image', self.selectedItem.css('background-image'));

                    if (count > 1)
                        itemCount.text(count);

                    self.selectedItem.css('background-image', '');

                    break;

                case 'shards':

                    image.css('background-image', self.selectedShards.css('background-image'));

                    if (count > 1)
                        itemCount.text(count);

                    self.selectedShards.css('background-image', '');

                    self.shardsCount.text('');

                    break;
            }
        },

        enchant: function() {
            this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Enchant]);
        },

        select: function(event) {
            this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Select, event.currentTarget.id.substring(17)]);
        },

        remove: function(type) {
            this.game.socket.send(Packets.Enchant, [Packets.EnchantOpcode.Remove, type]);
        },

        getInventorySize: function() {
            return this.interface.inventory.getSize();
        },

        getItemSlot: function(index) {
            return this.interface.inventory.container.slots[index];
        },

        display: function() {
            var self = this;

            self.body.fadeIn('fast');
            self.load();
        },

        hide: function() {
            var self = this;

            self.selectedItem.css('background-image', '');
            self.selectedShards.css('background-image', '');

            self.body.fadeOut('fast');
        },

        hasImage: function(image) {
            return image.css('background-image') !== 'none';
        },

        getSlot: function(index) {
            return $(this.getSlots().find('li')[index]);
        },

        getSlots: function() {
            return this.enchantSlots.find('ul');
        },

        isVisible: function() {
            return this.body.css('display') === 'block'
        }

    });

});