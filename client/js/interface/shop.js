define(['jquery', './container/container'], function($, Container) {

    return Class.extend({

        init: function(game, interface) {
            var self = this;

            self.game = game;

            self.body = $('#shop');
            self.shop = $('#shopContainer');
            self.inventory = $('#shopInventorySlots');

            /**
             * sellSlot represents what the player currently has queued for sale
             * and sellSlotReturn shows the currency the player is receiving.
             * The reason for this is because shops are written such that
             * they can handle different currencies.
             */

            self.sellSlot = $('#shopSellSlot');
            self.sellSlotReturn = $('#shopSellSlotReturn');
            self.sellSlotReturnText = $('#shopSellSlotReturnText');

            self.confirmSell = $('#confirmSell');

            self.player = game.player;
            self.interface = interface;

            self.container = null;
            self.data = null;

            self.openShop = -1;

            self.items = [];
            self.counts = [];

            self.close = $('#closeShop');

            self.close.css('left', '97%');
            self.close.click(function() {
                self.hide();
            });

            self.sellSlot.click(function() {
                self.remove();
            });

            self.confirmSell.click(function() {
                self.sell();
            });
        },

        buy: function(event) {
            var self = this,
                id = event.currentTarget.id.substring(11);

            self.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Buy, self.openShop, id, 1]);
        },

        sell: function() {
            // The server will handle the selected item and verifications.
            this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Sell, this.openShop]);
        },

        select: function(event) {
            var self = this,
                id = event.currentTarget.id.substring(17);

            self.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Select, self.openShop, id]);
        },

        remove: function() {
            this.game.socket.send(Packets.Shop, [Packets.ShopOpcode.Remove]);
        },

        move: function(info) {
            var self = this,
                inventorySlot = self.getInventoryList().find('#shopInventorySlot' + info.slotId),
                slotImage = inventorySlot.find('#inventoryImage' + info.slotId),
                slotText = inventorySlot.find('#inventoryItemCount' + info.slotId);

            self.sellSlot.css({
                'background-image': slotImage.css('background-image'),
                'background-size': slotImage.css('background-size')
            });

            self.sellSlotReturn.css({
                'background-image': self.container.getImageFormat(self.getScale(), info.currency),
                'background-size': self.sellSlot.css('background-size')
            });

            self.sellSlotReturnText.text(info.price);

            slotImage.css('background-image', '');
            slotText.text('');

        },

        moveBack: function(index) {
            var self = this,
                inventorySlot = self.getInventoryList().find('#shopInventorySlot' + index);

            inventorySlot.find('#inventoryImage' + index).css('background-image', self.sellSlot.css('background-image'));

            self.sellSlot.css('background-image', '');
            self.sellSlotReturn.css('background-image', '');
            self.sellSlotReturnText.text('');


        },

        /**
         * The shop file is already built to support full de-initialization of objects when
         * we receive an update about the stocks. So we just use that whenever we want to resize.
         * This is just a temporary fix, in reality, we do not want anyone to actually see the shop
         * do a full refresh when they buy an item or someone else buys an item.
         */

        resize: function() {
            var self = this;

            self.getInventoryList().empty();
            self.getShopList().empty();

            self.update(self.data);
        },

        update: function(data) {
            var self = this;

            self.reset();

            self.container = new Container(data.strings.length);

            //Update the global data to current revision
            self.data = data;

            self.load();
        },

        load: function() {
            var self = this;

            for (var i = 0; i < self.container.size; i++) {
                var shopItem = $('<div id="shopItem' + i + '" class="shopItem"></div>'),
                    string = self.data.strings[i],
                    name = self.data.names[i],
                    count = self.data.counts[i],
                    price = self.data.prices[i],
                    itemImage, itemCount, itemPrice, itemName, itemBuy;

                if (!string || !name || !count)
                    continue;

                itemImage = $('<div id="shopItemImage' + i + '" class="shopItemImage"></div>');
                itemCount = $('<div id="shopItemCount' + i + '" class="shopItemCount"></div>');
                itemPrice = $('<div id="shopItemPrice' + i + '" class="shopItemPrice"></div>');
                itemName = $('<div id="shopItemName' + i + '" class="shopItemName"></div>');
                itemBuy = $('<div id="shopItemBuy' + i + '" class="shopItemBuy"></div>');

                itemImage.css('background-image', self.container.getImageFormat(1, string));
                itemCount.html(count);
                itemPrice.html(price + 'g');
                itemName.html(name);
                itemBuy.html('Buy');

                self.container.setSlot(i, {
                    string: string,
                    count: count
                });

                // Bind the itemBuy to the local buy function.
                itemBuy.click(function(event) {
                    self.buy(event);
                });

                var listItem = $('<li></li>');

                shopItem.append(itemImage, itemCount, itemPrice, itemName, itemBuy);

                listItem.append(shopItem);

                self.getShopList().append(listItem);
            }

            var inventoryItems = self.interface.bank.getInventoryList(),
                inventorySize = self.interface.inventory.getSize();

            for (var j = 0; j < inventorySize; j++) {
                var item = $(inventoryItems[j]).clone(),
                    slot = item.find('#bankInventorySlot' + j);

                slot.attr('id', 'shopInventorySlot' + j);

                slot.click(function(event) {
                    self.select(event);
                });

                self.getInventoryList().append(slot);
            }
        },

        reset: function() {
            var self = this;

            self.items = [];
            self.counts = [];

            self.container = null;

            self.getShopList().empty();
            self.getInventoryList().empty();
        },

        open: function(id) {
            var self = this;

            if (!id)
                return;

            self.openShop = id;

            self.body.fadeIn('slow');
        },

        hide: function() {
            var self = this;

            self.openShop = -1;

            self.body.fadeOut('fast');
        },

        clear: function() {
            var self = this;

            if (self.shop)
                self.shop.find('ul').empty();

            if (self.inventory)
                self.inventory.find('ul').empty();

            if (self.close)
                self.close.unbind('click');

            if (self.sellSlot)
                self.sellSlot.unbind('click');

            if (self.confirmSell)
                self.confirmSell.unbind('click');
        },

        getScale: function() {
            return this.game.renderer.getScale();
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        isShopOpen: function(shopId) {
            return this.isVisible() && this.openShop === shopId;
        },

        getShopList: function() {
            return this.shop.find('ul');
        },

        getInventoryList: function() {
            return this.inventory.find('ul');
        }

    });


});
