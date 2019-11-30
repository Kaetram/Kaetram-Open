/* global log */

define(['jquery', '../interface/inventory',
    '../interface/profile/profile', '../interface/actions',
    '../interface/bank', '../interface/enchant', '../interface/warp',
    '../interface/shop', '../interface/header'],
function($, Inventory, Profile, Actions, Bank, Enchant, Warp, Shop, Header) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.notify = $('#notify');
            self.confirm = $('#confirm');
            self.message = $('#message');
            self.fade = $('#notifyFade');
            self.done = $('#notifyDone');

            self.inventory = null;
            self.profile = null;
            self.actions = null;
            self.enchant = null;
            self.shop = null;
            self.header = null;

            self.loadNotifications();
            self.loadActions();
            self.loadWarp();
            self.loadShop();

            self.done.click(function() {
                self.hideNotify();
            });
        },

        resize: function() {
            var self = this;

            if (self.inventory)
                self.inventory.resize();

            if (self.profile)
                self.profile.resize();

            if (self.bank)
                self.bank.resize();

            if (self.enchant)
                self.enchant.resize();

            if (self.shop && self.shop.isVisible())
                self.shop.resize();

            if (self.header)
                self.header.resize();

        },

        loadInventory: function(size, data) {
            var self = this;

            /**
             * This can be called multiple times and can be used
             * to completely refresh the inventory.
             */

            self.inventory = new Inventory(self.game, size);

            self.inventory.load(data);
        },

        loadBank: function(size, data) {
            var self = this;

            /**
             * Similar structure as the inventory, just that it
             * has two containers. The bank and the inventory.
             */

            if (!self.inventory) {
                log.error('Inventory not initialized.');
                return;
            }

            self.bank = new Bank(self.game, self.inventory.container, size);

            self.bank.load(data);

            self.loadEnchant();
        },

        loadProfile: function() {
            var self = this;

            if (!self.profile)
                self.profile = new Profile(self.game);
        },

        loadActions: function() {
            var self = this;

            if (!self.actions)
                self.actions = new Actions(self);
        },

        loadEnchant: function() {
            var self = this;

            if (!self.enchant)
                self.enchant = new Enchant(self.game, self);
        },

        loadWarp: function() {
            var self = this;

            if (!self.warp)
                self.warp = new Warp(self.game, self);
        },

        loadShop: function() {
            var self = this;

            if (!self.shop)
                self.shop = new Shop(self.game, self);
        },

        loadHeader: function() {
            var self = this;

            if (!self.header)
                self.header = new Header(self.game, self);
        },

        loadNotifications: function() {
            var self = this,
                ok = $('#ok'),
                cancel = $('#cancel'),
                done = $('#done');

            /**
             * Simple warning dialogue
             */

            ok.click(function() {

                self.hideNotify();
            });

            /**
             * Callbacks responsible for
             * Confirmation dialogues
             */

            cancel.click(function() {

                self.hideConfirm();
            });

            done.click(function() {
                log.info(self.confirm.className);

                self.hideConfirm();
            });
        },

        stop: function() {
            var self = this;

            if (self.inventory)
                self.inventory.clear();

            if (self.actions)
                self.actions.clear();

            if (self.profile)
                self.profile.clean();

            if (self.game.input)
                self.game.input.chatHandler.clear();

            if (self.bank)
                self.bank.clear();

            if (self.enchant)
                self.enchant.clear();

            if (self.warp)
                self.warp.clear();

            if (self.shop)
                self.shop.clear();

        },

        hideAll: function() {
            var self = this;

            if (self.inventory && self.inventory.isVisible())
                self.inventory.hide();

            if (self.actions && self.actions.isVisible())
                self.actions.hide();

            if (self.profile && (self.profile.isVisible() || self.profile.settings.isVisible()))
                self.profile.hide();

            if (self.game.input && self.game.input.chatHandler && self.game.input.chatHandler.input.is(':visible'))
                self.game.input.chatHandler.hideInput();

            if (self.bank && self.bank.isVisible())
                self.bank.hide();

            if (self.enchant && self.enchant.isVisible())
                self.enchant.hide();

            if (self.warp && self.warp.isVisible())
                self.warp.hide();

            if (self.shop && self.shop.isVisible())
                self.shop.hide();
        },

        addInventory: function(info) {
            var self = this;

            self.bank.addInventory(info);
        },

        removeInventory: function(info) {
            var self = this;

            self.bank.removeInventory(info);
        },

        displayNotify: function(message) {
            var self = this;

            if (self.isNotifyVisible())
                return;

            self.notify.css('display', 'block');
            self.fade.css('display', 'block');
            self.message.css('display', 'block');

            self.message.text(message);
        },

        displayConfirm: function(message) {
            var self = this;

            if (self.isConfirmVisible())
                return;

            self.confirm.css('display', 'block');
            self.confirm.text(message);
        },

        hideNotify: function() {
            var self = this;

            self.fade.css('display', 'none');
            self.notify.css('display', 'none');
            self.message.css('display', 'none');
        },

        hideConfirm: function() {
            this.confirm.css('display', 'none');
        },

        getQuestPage: function() {
            return this.profile.quests;
        },

        isNotifyVisible: function() {
            return this.notify.css('display') === 'block';
        },

        isConfirmVisible: function() {
            return this.confirm.css('display') === 'block';
        }

    });

});
