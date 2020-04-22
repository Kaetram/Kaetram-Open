/* global _, log */

define(['jquery'], function($) {

    return Class.extend({

        init: function(interface) {
            var self = this;

            self.interface = interface;

            self.body = $('#actionContainer');
            self.drop = $('#dropDialog');
            self.dropInput = $('#dropCount');

            self.activeClass = null;

            self.miscButton = null;

            self.load();
        },

        load: function() {
            var self = this,
                dropAccept = $('#dropAccept'),
                dropCancel = $('#dropCancel');

            dropAccept.click(function(event) {
                if (self.activeClass === 'inventory')
                    self.interface.inventory.clickAction(event);
            });

            dropCancel.click(function(event) {
                if (self.activeClass === 'inventory')
                    self.interface.inventory.clickAction(event);
            });
        },

        loadDefaults: function(activeClass, data) {
            var self = this;

            self.reset();
            self.activeClass = activeClass;

            if (data)
                self.body.css({
                    'left': data.mouseX - (self.body.width() / 2) + 'px',
                    'top': data.mouseY + (self.body.height() / 2) + 'px'
                });

            switch (self.activeClass) {
                case 'inventory':

                    self.body.css({
                        bottom: '10%',
                        left: '10%'
                    });

                    var dropButton = $('<div id="drop" class="actionButton">Drop</div>');

                    self.add(dropButton);

                    break;

                case 'player':

                    self.add(self.getFollowButton());

                    if (data.pvp)
                        self.add(self.getAttackButton());

                    break;

                case 'mob':

                    self.add(self.getFollowButton());
                    self.add(self.getAttackButton());

                    break;

                case 'npc':

                    self.add(self.getFollowButton());
                    self.add(self.getTalkButton());

                    break;

                case 'object':

                    log.info('[loadDefaults] object.');

                    break;
            }
        },

        add: function(button, misc) {
            var self = this;

            self.body.find('ul').prepend($('<li></li>').append(button));

            button.click(function(event) {
                if (self.activeClass === 'inventory')
                    self.interface.inventory.clickAction(event);

            });

            if (misc)
                self.miscButton = button;
        },

        removeMisc: function() {
            var self = this;

            self.miscButton.remove();
            self.miscButton = null;
        },

        reset: function() {
            var self = this,
                buttons = self.getButtons();

            for (var i = 0; i < buttons.length; i++)
                $(buttons[i]).remove();
        },

        show: function() {
            this.body.fadeIn('fast');
        },

        hide: function() {
            this.body.fadeOut('slow');
        },

        clear: function() {
            var self = this;

            $('#dropAccept').unbind('click');
            $('#dropCancel').unbind('click');

            self.trade.unbind('click');
            self.follow.unbind('click');
        },

        displayDrop: function(activeClass) {
            var self = this;

            self.activeClass = activeClass;

            self.drop.fadeIn('fast');

            self.dropInput.focus();
            self.dropInput.select();
        },

        hideDrop: function() {
            var self = this;

            self.drop.fadeOut('slow');

            self.dropInput.blur();
            self.dropInput.val('');
        },

        getAttackButton: function() {
            return $('<div id="attack" class="actionButton">Attack</div>');
        },

        getFollowButton: function() {
            return $('<div id="follow" class="actionButton">Follow</div>');
        },

        getTradeButton: function() {
            return $('<div id="trade" class="actionButton">Trade</div>');
        },

        getTalkButton: function() {
            return $('<div id="talkButton" class="actionButton">Talk</div>');
        },

        getButtons: function() {
            return this.body.find('ul').find('li');
        },

        getGame: function() {
            return this.interface.game;
        },

        getPlayer: function() {
            return this.interface.game.player;
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        }

    });

});
