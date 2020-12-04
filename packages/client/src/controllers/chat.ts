import $ from 'jquery';

import Game from '../game';
import Packets from '../network/packets';
import Modules from '../utils/modules';

export default class ChatController {
    game: Game;
    chat: JQuery;
    log: JQuery;
    input: JQuery;
    button: JQuery;
    visible: boolean;
    fadingDuration: number;
    fadingTimeout: number;

    constructor(game: Game) {
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

    add(source: string, text: string, colour?: string): void {
        const element = $(`<p>${source} » ${text}</p>`);

        this.showChat();

        if (!this.isActive()) this.hideInput();

        this.hideChat();

        element.css('color', colour ? colour : 'white');

        this.log.append(element);
        this.log.scrollTop(99999);
    }

    key(data: number): void {
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

    send(): void {
        this.game.socket.send(Packets.Chat, [this.input.val()]);
        this.toggle();
    }

    toggle(): void {
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

    showChat(): void {
        this.chat.fadeIn('fast');

        this.visible = true;
    }

    showInput(): void {
        this.button.addClass('active');

        this.input.fadeIn('fast');
        this.input.val('');
        this.input.focus();

        this.clean();
    }

    hideChat(): void {
        if (this.fadingTimeout) {
            clearTimeout(this.fadingTimeout);
            this.fadingTimeout = null;
        }

        this.fadingTimeout = window.setTimeout(() => {
            if (!this.isActive()) {
                this.chat.fadeOut('slow');

                this.visible = false;
            }
        }, this.fadingDuration);
    }

    hideInput(): void {
        this.button.removeClass('active');

        this.input.val('');
        this.input.fadeOut('fast');
        this.input.blur();

        this.hideChat();
    }

    clear(): void {
        if (this.button) this.button.off('click');
    }

    clean(): void {
        clearTimeout(this.fadingTimeout);
        this.fadingTimeout = null;
    }

    isActive(): boolean {
        return this.input.is(':focus');
    }
}
