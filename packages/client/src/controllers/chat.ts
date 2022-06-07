import $ from 'jquery';

import { Packets } from '@kaetram/common/network';

import type Game from '../game';

export default class ChatController {
    private chatBox: JQuery<HTMLElement> = $('#chat');
    private log: JQuery<HTMLElement> = $('#chat-log');
    private input: JQuery<HTMLElement> = $('#chat-input');
    private button = $('#chat-button');

    private readonly fadingDuration = 5000;
    private fadingTimeout!: number | undefined;

    public constructor(private game: Game) {
        this.button.on('click', () => this.toggle());
    }

    /**
     * Handles key input from the handler. Pressing the ENTER
     * key will trigger the chat input similar to the button.
     * @param key The key identifier from the JQuery KeyDownEvent.
     */

    public keyDown(key: string): void {
        if (key === 'Enter' && this.input.val() !== '') return this.send();
        if (key === 'Escape' || key === 'Enter') this.toggle();
    }

    /**
     * Adds an entry to the chat box with the source,
     * message, and optional colour (defaults to white).
     * @param source Who is sending the message (username).
     * @param message The contents of the message being sent.
     * @param colour Optional parameter for the colour of the message.
     */

    public add(source: string, message: string, colour = '', notify = false): void {
        let element = this.createElement(source, message);

        element.css('color', colour || 'white');

        // Scroll to the bottom of the chat log.
        this.log.append(element).scrollTop(this.log.prop('scrollHeight'));

        this.displayChatBox();

        // Start the timeout for hiding the chatbox.
        this.hideChatBox();

        if (notify) {
            this.clearTimeout();
            this.hide();
        }
    }

    /**
     * Creates a chatbox element that we use to append to the chat log.
     * @param source Who is sending the message, the player's username.
     * @param message The contents of the message.
     */

    private createElement(source: string, message: string): JQuery<HTMLElement> {
        return $(`<p>${source} » ${message}</p>`);
    }

    /**
     * Sends a packet to the server with the string
     * of the chat message in the input field.
     */

    public send(): void {
        this.game.socket.send(Packets.Chat, [this.input.val()]);

        this.hide();
    }

    /**
     * Toggles the chat input and box.
     */

    public toggle(): void {
        this.clearTimeout();

        if (this.inputVisible()) this.hide();
        else this.display();
    }

    /**
     * Makes the input field for the chat visible.
     * It also updates the state of the chat button.
     */

    private display(): void {
        this.button.addClass('active');

        this.displayChatBox();

        // Fade input in, clear the input field, and focus it.
        this.input.fadeIn('fast').val('').trigger('focus');
    }

    /**
     * Fades in the entire chatbox.
     */

    private displayChatBox(): void {
        this.chatBox.fadeIn('fast');
    }

    /**
     * Clears the input field and hides it from the view.
     * It also updates the state of the chat button.
     */

    private hide(): void {
        this.button.removeClass('active');

        this.hideChatBox();

        // Fade input out and clear the input field.
        this.input.fadeOut('fast').val('').trigger('blur');
    }

    /**
     * Hides the chatbox after running a timeout for
     * `fadingDuration` period of time.
     */

    private hideChatBox(): void {
        this.fadingTimeout = window.setTimeout(() => {
            if (!this.inputVisible()) this.chatBox.fadeOut('slow');
        }, this.fadingDuration);
    }

    /**
     * Checks if the input element has a visible value.
     * @returns Whether `:visible` flag is in the HTML element.
     */

    public inputVisible(): boolean {
        return this.input.is(':visible');
    }

    /**
     * Cleans all the chat inputs and hides everything if
     * the input is visible.
     */

    public clear(): void {
        if (this.inputVisible()) this.toggle();

        this.clearTimeout();
    }

    /**
     * Clears the fading timeout. The fading timeout represents
     * the delay before the chat box fades out.
     */

    public clearTimeout(): void {
        clearTimeout(this.fadingTimeout);
        window.clearTimeout(this.fadingTimeout);

        this.fadingTimeout = undefined;
    }
}
