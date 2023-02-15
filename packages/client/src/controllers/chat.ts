import Util from '../utils/util';

import { Packets } from '@kaetram/common/network';

import type Game from '../game';

export default class ChatController {
    private chatBox: HTMLElement = document.querySelector('#chat')!;
    private log: HTMLElement = document.querySelector('#chat-log')!;
    private input: HTMLInputElement = document.querySelector('#chat-input')!;
    private button = document.querySelector('#chat-button')!;

    private readonly fadingDuration = 5000;
    private fadingTimeout!: number | undefined;

    public constructor(private game: Game) {
        this.button.addEventListener('click', () => this.toggle());

        this.input.addEventListener('blur', () => this.hide());
    }

    /**
     * Handles key input from the handler. Pressing the ENTER
     * key will trigger the chat input similar to the button.
     * @param key The key identifier from the JQuery KeyDownEvent.
     */

    public keyDown(key: string): void {
        if (key === 'Enter' && this.input.value !== '') return this.send();
        if (key === 'Escape' || key === 'Enter') this.toggle();
    }

    /**
     * Opens the chat box and automatically types the private message command.
     * This is a temporary solution until we advance the chatbox some more.
     * @param username The username of the friend we are messaging.
     */

    public privateMessage(username: string): void {
        if (this.inputVisible()) return;

        this.toggle();

        this.input.value = `/pm *${username}* `;
        this.input.focus();
    }

    /**
     * Adds an entry to the chat box with the source,
     * message, and optional colour (defaults to white).
     * @param source Who is sending the message (username).
     * @param message The contents of the message being sent.
     * @param colour Optional parameter for the colour of the message.
     * @param notify Optional parameter for whether to bold the message.
     */

    public add(source: string, message: string, colour = '', notify = false): void {
        let element = this.createElement(source, message);

        element.style.color = colour || 'white';
        if (notify) element.style.fontWeight = 'bold';

        // Scroll to the bottom of the chat log.
        this.log.append(element);
        this.log.scrollTop = this.log.scrollHeight;

        this.displayChatBox();

        // Start the timeout for hiding the chatbox.
        this.hideChatBox();
    }

    /**
     * Creates a chatbox element that we use to append to the chat log.
     * @param source Who is sending the message, the player's username.
     * @param message The contents of the message.
     */

    private createElement(source: string, message: string): HTMLElement {
        let element = document.createElement('p');
        element.innerHTML = `${source} » ${message}`;

        return element;
    }

    /**
     * Sends a packet to the server with the string
     * of the chat message in the input field.
     */

    public send(): void {
        this.game.socket.send(Packets.Chat, [this.input.value]);

        this.hide();
    }

    /**
     * Toggles the chat input and box.
     * @param text Optional parameter for the text to display in the input field.
     */

    public toggle(): void {
        this.clearTimeout();

        if (this.inputVisible()) this.hide();
        else this.display();
    }

    /**
     * Makes the input field for the chat visible.
     * It also updates the state of the chat button.
     * @param text Optional parameter for the text to display in the input field.
     */

    private display(): void {
        this.button.classList.add('active');

        if (this.inputVisible()) this.input.style.display = 'block';
        else Util.fadeIn(this.input);

        this.displayChatBox();

        // Fade input in, clear the input field, and focus it.
        this.input.focus();
        this.input.value = '';

        this.log.scrollTop = this.log.scrollHeight;

        Util.fadeIn(this.input);
    }

    /**
     * Fades in the entire chatbox.
     */

    private displayChatBox(): void {
        Util.fadeIn(this.chatBox);
    }

    /**
     * Clears the input field and hides it from the view.
     * It also updates the state of the chat button.
     */

    private hide(): void {
        this.button.classList.remove('active');

        this.hideChatBox();

        // Fade input out and clear the input field.

        this.input.blur();
        this.input.value = '';

        this.log.scrollTop = this.log.scrollHeight;

        Util.fadeOut(this.input);
    }

    /**
     * Hides the chatbox after running a timeout for
     * `fadingDuration` period of time.
     */

    private hideChatBox(): void {
        this.clearTimeout();

        this.fadingTimeout = window.setTimeout(() => {
            if (!this.inputVisible()) Util.fadeOut(this.chatBox);
        }, this.fadingDuration);
    }

    /**
     * Checks if the input element has a visible value.
     * @returns Whether `:visible` flag is in the HTML element.
     */

    public inputVisible(): boolean {
        return this.input.style.display === 'block';
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
