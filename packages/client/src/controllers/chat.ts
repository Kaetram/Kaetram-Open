import $ from 'jquery';

import Packets from '@kaetram/common/src/packets';
import * as Modules from '@kaetram/common/src/modules';

import type Game from '../game';

export default class ChatController {
    private chat = $('#chat');
    private log = $('#chatLog');
    public input = $('#chatInput');
    private button = $('#chatButton');

    private visible = false;

    private fadingDuration = 5000 as const;
    private fadingTimeout!: number | null;

    public constructor(private game: Game) {
        this.button.on('click', () => {
            this.button.trigger('blur');

            if (this.input.is(':visible')) this.hideInput();
            else this.toggle();
        });
    }

    public add(source: string, text: string, colour?: string): void {
        const element = $(`<p>${source} » ${text}</p>`);

        this.showChat();

        if (!this.isActive()) this.hideInput();

        this.hideChat();

        element.css('color', colour || 'white');

        this.log.append(element);
        this.log.scrollTop(99999);
    }

    public key(data: Modules.Keys): void {
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

    private send(): void {
        this.game.socket?.send(Packets.Chat, [this.input.val()]);
        this.toggle();
    }

    public toggle(): void {
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

    private showChat(): void {
        this.chat.fadeIn('fast');

        this.visible = true;
    }

    private showInput(): void {
        this.button.addClass('active');

        this.input.fadeIn('fast');
        this.input.val('');
        this.input.trigger('focus');

        this.clean();
    }

    private hideChat(): void {
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

    public hideInput(): void {
        this.button.removeClass('active');

        this.input.val('');
        this.input.fadeOut('fast');
        this.input.trigger('blur');

        this.hideChat();
    }

    public clear(): void {
        this.button.off('click');
    }

    private clean(): void {
        clearTimeout(this.fadingTimeout as number);
        this.fadingTimeout = null;
    }

    public isActive(): boolean {
        return this.input.is(':focus');
    }
}
