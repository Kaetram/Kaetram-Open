/* global Packets, Modules, log */

import $ from 'jquery';
import Modules from '../utils/modules';
import Packets from '../network/packets';

export default class Chat {
    game: any;
    chat: JQuery<HTMLElement>;
    log: JQuery<HTMLElement>;
    input: JQuery<HTMLElement>;
    button: JQuery<HTMLElement>;
    visible: boolean;
    fadingDuration: number;
    fadingTimeout: any;
    constructor(game) {
        this.game = game;

        this.chat = $('#chat');
        this.log = $('#chatLog');
        this.input = $('#chatInput');
        this.button = $('#chatButton');

        this.visible = false;

        this.fadingDuration = 5000;
        this.fadingTimeout = null;

        this.button.click(() => {
            this.button.blur();

            if (this.input.is(':visible')) this.hideInput();
            else this.toggle();
        });
    }

    add(source, text, colour) {
        const element = $('<p>' + source + ': ' + text + '</p>');

        this.showChat();

        if (!this.isActive()) this.hideInput();

        this.hideChat();

        element.css('color', colour || 'white');

        this.log.append(element);
        this.log.scrollTop(99999);
    }

    key(data) {
        switch (data) {
            case Modules.Keys.Esc:
                this.toggle();

                break;

            case Modules.Keys.Enter:
                if (this.input.val() === '') this.toggle();
                else this.send();

                break;
        }
    }

    send() {
        this.game.socket.send(Packets.Chat, [this.input.val()]);
        this.toggle();
    }

    toggle() {
        this.clean();

        if (this.visible && !this.isActive()) this.showInput();
        else if (this.visible) {
            this.hideInput();
            this.hideChat();
        } else {
            this.showChat();
            this.showInput();
        }
    }

    showChat() {
        this.chat.fadeIn('fast');

        this.visible = true;
    }

    showInput() {
        this.button.addClass('active');

        this.input.fadeIn('fast');
        this.input.val('');
        this.input.focus();

        this.clean();
    }

    hideChat() {
        if (this.fadingTimeout) {
            clearTimeout(this.fadingTimeout);
            this.fadingTimeout = null;
        }

        this.fadingTimeout = setTimeout(() => {
            if (!this.isActive()) {
                this.chat.fadeOut('slow');

                this.visible = false;
            }
        }, this.fadingDuration);
    }

    hideInput() {
        this.button.removeClass('active');

        this.input.val('');
        this.input.fadeOut('fast');
        this.input.blur();

        this.hideChat();
    }

    clear() {
        if (this.button) this.button.unbind('click');
    }

    clean() {
        clearTimeout(this.fadingTimeout);
        this.fadingTimeout = null;
    }

    isActive() {
        return this.input.is(':focus');
    }
};
