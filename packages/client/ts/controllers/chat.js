import $ from 'jquery';
import Packets from '../network/packets';
import Modules from '../utils/modules';

export default class ChatController {
    constructor(game) {
        var self = this;

        self.game = game;

        self.chat = $('#chat');
        self.log = $('#chatLog');
        self.input = $('#chatInput');
        self.button = $('#chatButton');

        self.visible = false;

        self.fadingDuration = 5000;
        self.fadingTimeout = null;

        self.button.click(function () {
            self.button.blur();

            if (self.input.is(':visible')) self.hideInput();
            else self.toggle();
        });
    }

    add(source, text, colour) {
        var self = this,
            element = $('<p>' + source + ' » ' + text + '</p>');

        self.showChat();

        if (!self.isActive()) self.hideInput();

        self.hideChat();

        element.css('color', colour ? colour : 'white');

        self.log.append(element);
        self.log.scrollTop(99999);
    }

    key(data) {
        var self = this;

        switch (data) {
            case Modules.Keys.Esc:
                self.toggle();

                break;

            case Modules.Keys.Enter:
                if (self.input.val() === '') self.toggle();
                else self.send();

                break;
        }
    }

    send() {
        var self = this;

        self.game.socket.send(Packets.Chat, [self.input.val()]);
        self.toggle();
    }

    toggle() {
        var self = this;

        self.clean();

        if (self.visible && !self.isActive()) self.showInput();
        else if (self.visible) {
            self.hideInput();
            self.hideChat();
        } else {
            self.showChat();
            self.showInput();
        }
    }

    showChat() {
        var self = this;

        self.chat.fadeIn('fast');

        self.visible = true;
    }

    showInput() {
        var self = this;

        self.button.addClass('active');

        self.input.fadeIn('fast');
        self.input.val('');
        self.input.focus();

        self.clean();
    }

    hideChat() {
        var self = this;

        if (self.fadingTimeout) {
            clearTimeout(self.fadingTimeout);
            self.fadingTimeout = null;
        }

        self.fadingTimeout = setTimeout(function () {
            if (!self.isActive()) {
                self.chat.fadeOut('slow');

                self.visible = false;
            }
        }, self.fadingDuration);
    }

    hideInput() {
        var self = this;

        self.button.removeClass('active');

        self.input.val('');
        self.input.fadeOut('fast');
        self.input.blur();

        self.hideChat();
    }

    clear() {
        var self = this;

        if (self.button) self.button.unbind('click');
    }

    clean() {
        var self = this;

        clearTimeout(self.fadingTimeout);
        self.fadingTimeout = null;
    }

    isActive() {
        return this.input.is(':focus');
    }
}
