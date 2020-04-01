/* global Packets, Modules, log */

define(['jquery'], function($) {

    return Class.extend({

        init: function(game) {
            var self = this;

            self.game = game;

            self.chat = $('#chat');
            self.log = $('#chatLog');
            self.input = $('#chatInput');
            self.button = $('#chatButton');

            self.visible = false;

            self.fadingDuration = 5000;
            self.fadingTimeout = null;

            self.button.click(function() {

                self.button.blur();

                if (self.input.is(':visible'))
                    self.hideInput();
                else
                    self.toggle();

            });
        },

        add: function(source, text, colour) {
            var self = this,
                element = $('<p>' + source + ' » ' + text + '</p>');

            self.showChat();

            if (!self.isActive())
                self.hideInput();

            self.hideChat();

            element.css('color', colour ? colour : 'white');

            self.log.append(element);
            self.log.scrollTop(99999);
        },

        key: function(data) {
            var self = this;

            switch(data) {
                case Modules.Keys.Esc:

                    self.toggle();

                    break;

                case Modules.Keys.Enter:

                    if (self.input.val() === '')
                        self.toggle();
                    else
                        self.send();

                    break;
            }
        },

        send: function() {
            var self = this;

            self.game.socket.send(Packets.Chat, [self.input.val()]);
            self.toggle();
        },

        toggle: function() {
            var self = this;

            self.clean();

            if (self.visible && !self.isActive())
                self.showInput();
            else if (self.visible) {
                self.hideInput();
                self.hideChat();
            } else {
                self.showChat();
                self.showInput();
            }

        },

        showChat: function() {
            var self = this;

            self.chat.fadeIn('fast');

            self.visible = true;
        },

        showInput: function() {
            var self = this;

            self.button.addClass('active');

            self.input.fadeIn('fast');
            self.input.val('');
            self.input.focus();

            self.clean();
        },

        hideChat: function() {
            var self = this;

            if (self.fadingTimeout) {
                clearTimeout(self.fadingTimeout);
                self.fadingTimeout = null;
            }

            self.fadingTimeout = setTimeout(function() {

                if (!self.isActive()) {
                    self.chat.fadeOut('slow');

                    self.visible = false;
                }

            }, self.fadingDuration);
        },

        hideInput: function() {
            var self = this;

            self.button.removeClass('active');

            self.input.val('');
            self.input.fadeOut('fast');
            self.input.blur();

            self.hideChat();
        },

        clear: function() {
            var self = this;

            if (self.button)
                self.button.unbind('click');
        },

        clean: function() {
            var self = this;

            clearTimeout(self.fadingTimeout);
            self.fadingTimeout = null;
        },

        isActive: function() {
            return this.input.is(':focus');
        }
    });

});
