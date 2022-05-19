import $ from 'jquery';
import _ from 'lodash';

import install from './lib/pwa';

import Util from './utils/util';
import Storage from './utils/storage';

import { isMobile } from './utils/detect';

type EmptyCallback = () => void;
type KeyDownCallback = (e: JQuery.KeyDownEvent) => void;
type KeyUpCallback = (e: JQuery.KeyUpEvent) => void;
type LeftClickCallback = (e: JQuery.ClickEvent) => void;
type RightClickCallback = (e: JQuery.ContextMenuEvent) => void;
type MouseMoveCallback = (e: JQuery.MouseMoveEvent) => void;

export default class App {
    public config = window.config;

    public storage: Storage = new Storage();

    public body = $('body');

    private parchment = $('#parchment');
    private window = $(window);

    public canvas = $('#canvas');

    private forms = $('#intro form');

    private passwordConfirmation: JQuery<HTMLInputElement> = $(
        '#register-password-confirmation-input'
    );
    private emailField: JQuery<HTMLElement> = $('#register-email-input');

    private loginButton = $('#login');
    private registerButton = $('#new-account');
    private helpButton = $('#help-button');
    private cancelButton = $('#cancel-button');

    private respawn = $('#respawn');

    private rememberMe = $('#remember-me input');
    private guest = $('#guest input');

    private about = $('#toggle-about');
    private credits = $('#toggle-credits');
    private discord = $('#toggle-discord');

    private loading = $('.loader');

    private footer = $('footer');

    private currentScroll = 'load-character';
    private parchmentAnimating = false;
    private loggingIn = false; // Used to prevent interactions when trying to log in.
    private menuHidden = false; // Used to reroute key input to the callback.

    public statusMessage = '';

    public keyDownCallback?: KeyDownCallback;
    public keyUpCallback?: KeyUpCallback;
    public loginCallback?: EmptyCallback;
    public leftClickCallback?: LeftClickCallback;
    public rightClickCallback?: RightClickCallback;
    public mouseMoveCallback?: MouseMoveCallback;
    public resizeCallback?: EmptyCallback;
    public respawnCallback?: EmptyCallback;

    public constructor() {
        this.sendStatus(`Initializing the game client...`);

        this.load();
    }

    /**
     * Loads all the callbacks responsible
     * for interactions. Things such as mouse clicks,
     * keyboard presses, interaction with main menu
     * elements, etc.
     */

    private load(): void {
        this.forms.on('submit', (e: Event) => this.login(e));

        this.registerButton.on('click', () => this.openScroll('create-character'));
        this.cancelButton.on('click', () => this.openScroll('load-character'));

        this.about.on('click', () => this.openScroll('about'));
        this.credits.on('click', () => this.openScroll('credits'));
        this.discord.on('click', () => window.open('https://discord.gg/MmbGAaw'));

        this.respawn.on('click', () => this.respawnCallback?.());

        this.parchment.on('click', () => {
            if (this.hasFooterOpen()) this.openScroll('load-character');
        });

        // Document callbacks such as clicks and keystrokes.
        $(document).on('keydown', (e: JQuery.KeyDownEvent) => e.key !== 'Enter'); // Prevent enter key from submitting forms.
        $(document).on('keydown', this.handleKeyDown.bind(this));
        $(document).on('keyup', (e: JQuery.KeyUpEvent) => this.keyUpCallback?.(e));
        $(document).on('mousemove', (e: JQuery.MouseMoveEvent) => this.mouseMoveCallback?.(e));

        // Canvas callbacks
        this.canvas.on('click', (e: JQuery.ClickEvent) => this.leftClickCallback?.(e));

        // Window callbacks
        this.window.on('resize', () => this.resizeCallback?.());

        // Body callbacks
        this.body.on('contextmenu', '#canvas', (e: JQuery.ContextMenuEvent) =>
            this.handleRightClick(e)
        );
    }

    /**
     * Loads the local storage values for the username,
     * password, and remember me checkmark. If there is an
     * error in the storage, it will be displayed and immediately
     * removed when the function to get is is called.
     */

    private loadLogin(): void {
        // Grab and erase the error message.
        let errorMessage = this.storage.getError();

        // Display the error message if present.
        if (errorMessage) this.sendError(errorMessage);

        // No need to load anything if the remember me isn't toggled.
        if (!this.storage.hasRemember()) return;

        // Update the input fields with the stored values.
        this.getUsernameField().val(this.storage.getUsername());
        this.getPasswordField().val(this.storage.getPassword());

        // Set the checkmark for remember me to true.
        this.rememberMe.prop('checked', true);
    }

    /**
     * Handler for key down input event. When the menu is hidden,
     * that is, the game has started, we redirect all input to the
     * callback function.
     * @param e Event containing key data.
     */

    public handleKeyDown(e: JQuery.KeyDownEvent): void {
        if (this.menuHidden) return this.keyDownCallback?.(e);

        if (e.key === 'Enter') this.login();
    }

    /**
     * Handles the left click action onto the canvas and
     * returns false so that it cancels the default action.
     * @param e Event containing click information.
     * @returns False to cancel default action.
     */

    public handleRightClick(e: JQuery.ContextMenuEvent): boolean {
        this.rightClickCallback?.(e);

        e.preventDefault();

        return false;
    }

    /**
     * Clears all the status messages and allows the
     * login button to be pressed. This function generally
     * gets called once the map has finished loading.
     */

    public ready(): void {
        this.sendStatus();

        this.loginButton.prop('disabled', false);

        this.loadLogin();
    }

    /**
     * Attempts to log in by checking all the necessary fields and creating
     * a callback should all checks pass.
     * @param e Optional event parameter (for when we receive a form submission).
     */

    private login(e?: Event): void {
        if (e) e.preventDefault();

        if (this.loggingIn || this.statusMessage || !this.verifyForm()) return;

        this.clearErrors();
        this.toggleLogin(true);

        // Creates a callback with all the fields.
        this.loginCallback?.();

        // Installs the PWA.
        install();
    }

    /**
     * Checks if the remember me checkbox is toggled and
     * saves the username and password to local storage.
     */

    private saveLogin(): void {
        // Always save the state of the remember me button.
        this.storage.setRemember(this.isRememberMe());

        // Reset the credentials each successful login.
        this.storage.setCredentials();

        // Stop here if the checkmark isn't toggled.
        if (!this.isRememberMe()) return;

        // Save the username and password.
        this.storage.setCredentials(this.getUsername(), this.getPassword());
    }

    /**
     * Shows all the elements regarding the main
     * menu and hides the game element.
     */

    public showMenu(): void {
        this.body.removeClass('game');
        this.body.removeClass('started');
        this.body.addClass('intro');

        this.footer.show();

        this.menuHidden = false;
    }

    /**
     * Clears the loader and begins showing
     * the game after a 500 millisecond timeout.
     */

    public fadeMenu(): void {
        this.updateLoader();

        window.setTimeout(() => {
            this.body.addClass('game');
            this.body.addClass('started');

            this.body.removeClass('intro');

            this.footer.hide();

            this.menuHidden = true;

            this.saveLogin();
        }, 500);
    }

    /**
     * Opens a scroll by changing to the destination. Clears
     * errors from the current scroll, and checks if to animate
     * or not depending on if the dimensions match that of a mobile.
     * @param destination The new scroll we are setting to.
     */

    public openScroll(destination: string): void {
        if (this.loggingIn || this.parchmentAnimating) return;

        // Clears all errors that may have been displayed.
        this.clearErrors();

        this.changeScroll(destination, !isMobile());
    }

    /**
     * Changes a scroll with or without an animation. It updates the current scroll
     * variable in the class as well.
     * @param destination The destination of the scroll we're changing to.
     * @param withAnimation Whether or not to use animation when changing scrolls.
     */

    public changeScroll(destination: string, withAnimation = false): void {
        if (withAnimation) {
            this.parchmentAnimating = true;

            // Toggle animation and remove the current scroll class from parchment.
            this.parchment.toggleClass('animate').removeClass(this.currentScroll);

            // Set a timeout for the animation before displaying data.
            window.setTimeout(() => {
                // Toggle so that we can allow changing scrolls again.
                this.parchmentAnimating = false;

                // Animate again and add the new destination scroll.
                this.parchment.toggleClass('animate').addClass(destination);

                // Focus on the first text field in the new scroll.
                $(`#${destination} input`)[0]?.focus();
            }, 1000);
        } else this.parchment.removeClass(this.currentScroll).addClass(destination);

        // Update the current scroll we're on to the destination.
        this.currentScroll = destination;
    }

    /**
     * Verifies the form inputs. Checks that the username, password,
     * and email (if registering) are valid. It also checks against
     * whether the password confirmation matches the password inputted.
     * @returns True if all the checks pass, false otherwise.
     */

    private verifyForm(): boolean {
        // Guest users don't need to input anything.
        if (this.isGuest()) return true;

        // Check the username is not empty.
        if (!this.getUsername())
            return this.sendError('Please enter a username.', this.getUsernameField());

        // Check if the password is not empty.
        if (!this.getPassword())
            return this.sendError('Please enter a password.', this.getPasswordField());

        // Handle registration page.
        if (this.isRegistering()) {
            // Password must be at least 3 characters long.
            if (this.getPassword().length < 3)
                return this.sendError(
                    'Password must be at least 3 characters long.',
                    this.getPasswordField()
                );

            // Check that the password matches the password confirmation.
            if (this.getPassword() !== this.getPasswordConfirmation())
                return this.sendError('Passwords do not match.', this.passwordConfirmation);

            // Verify email against regex.
            if (!Util.isEmail(this.getEmail()))
                return this.sendError(`The email you've entered is not valid.`, this.emailField);
        }

        return true;
    }

    /**
     * A status is a form of message used during the loading
     * of the client. It is the blue text shown when we are
     * initializing the map, renderer, etc.
     * @param message Status string message to display.
     */

    public sendStatus(message = ''): void {
        this.clearErrors();

        this.statusMessage = message;

        if (!message) return;

        $('<span></span>', {
            class: 'status blink',
            text: message
        }).appendTo('.validation-summary');

        $('.status').append(this.getLoaderDots());
    }

    /**
     * A loader functions as a status update which is displayed
     * during the connection process. It shows black letters followed
     * by the loader dots.
     * @param message The message to display.
     */

    public updateLoader(message = ''): void {
        if (message) this.loading.html(message + this.getLoaderDots());
        else this.loading.html('');
    }

    /**
     * An error is a red message displayed on the login
     * or registration page. This is generally when something
     * goes wrong, like an invalid input, server responding
     * with an error, or a malfunction in the client.
     * @param field A field can be specified to point out an error.
     * @param error An error message is specified to be displayed.
     * @returns Defaults to returning false so that it can be used
     * during the form validation as a return statement for cleanliness.
     */

    public sendError(error: string, field?: JQuery<HTMLElement>): boolean {
        // Clear existing errors.
        this.clearErrors();

        // Appends an error component to the validation summary.
        $('<span></span>', {
            class: 'validation-error blink',
            text: error
        }).appendTo('.validation-summary');

        // Stop here if no field is specified.
        if (!field) return false;

        // Circles a field with a red border.
        field.addClass('field-error').trigger('select');
        field.on('keypress', function (event) {
            field.removeClass('field-error');

            $('.validation-error').remove();

            $(this).off(event);
        });

        return false;
    }

    /**
     * Clears all the errors that may have been displayed.
     * This goes through all the fields as well as erasing
     * the messages displayed.
     */

    public clearErrors(): void {
        this.getUsernameField().removeClass('field-error');
        this.getPasswordField().removeClass('field-error');

        this.passwordConfirmation.removeClass('field-error');
        this.emailField.removeClass('field-error');

        $('.validation-error').remove();
        $('.status').remove();
    }

    /**
     * Prepares the main menu for the login status. We disable
     * ability to change between scrolls, the login/register
     * buttons, as well as hide certain elements.
     */

    public toggleLogin(toggle: boolean): void {
        this.updateLoader('Connecting');

        this.toggleTyping(toggle);

        this.loggingIn = toggle;

        if (toggle) this.loading.removeAttr('hidden');
        else this.loading.attr('hidden', 'true');

        this.loginButton.prop('disabled', toggle);
        this.registerButton.prop('disabled', toggle);
    }

    /**
     * Toggles the readonly state of the input fields.
     * @param state Boolean value to set the readonly state to.
     */

    private toggleTyping(state: boolean): void {
        this.getUsernameField().prop('readonly', state);
        this.getPasswordField().prop('readonly', state);

        this.passwordConfirmation.prop('readonly', state);
        this.emailField.prop('readonly', state);
    }

    /**
     * UI scaling determines which size of assets to use depending
     * on the screen size. It also adjusts the CSS accordingly.
     * @returns UI scale from 1 to 3.
     */

    public getUIScale(): number {
        let width = window.innerWidth,
            height = window.innerHeight;

        return width <= 1000 ? 1 : width <= 1500 || height <= 870 ? 2 : 3;
    }

    /**
     * Checks if any of the footer items (about and credits) are active.
     * @returns Whether or not parchment contains `about` or `credits`.
     */

    private hasFooterOpen(): boolean {
        return this.parchment.hasClass('about') || this.parchment.hasClass('credits');
    }

    /**
     * @returns Whether or not the guest toggle is checked.
     */

    public isGuest(): boolean {
        return this.guest.prop('checked');
    }

    public isRememberMe(): boolean {
        return this.rememberMe.prop('checked');
    }

    /**
     * Checks whether or not the current activity in the main
     * menu is the register screen.
     * @returns Whether or not the current scroll is the `create-character` scroll.
     */

    public isRegistering(): boolean {
        return this.currentScroll === 'create-character';
    }

    /**
     * @returns The jQuery HTML element of the username field
     * depending on the currently open scroll.
     */

    private getUsernameField(): JQuery<HTMLInputElement> {
        return $(this.isRegistering() ? '#register-name-input' : '#login-name-input');
    }

    /**
     * Grabs the username field value from either the login screen or the register
     * screen depending on the status of the current scroll open.
     * @returns String value of the input field.
     */

    public getUsername(): string {
        return this.getUsernameField().val()! as string;
    }

    /**
     * @returns The JQuery HTML element of the password field
     * depending on the currently open scroll.
     */

    private getPasswordField(): JQuery<HTMLInputElement> {
        return $(this.isRegistering() ? '#register-password-input' : '#login-password-input');
    }

    /**
     * Grabs the password value from the field. Acts the same as `getUsername` in that
     * it selects the adequate field depending on the currently open scroll.
     * @returns Raw string value of the password field.
     */

    public getPassword(): string {
        return this.getPasswordField().val()! as string;
    }

    /**
     * @returns The password confirmation field input string.
     */

    private getPasswordConfirmation(): string {
        return this.passwordConfirmation.val()! as string;
    }

    /**
     * Grabs the email field input from the register screen. If we are
     * not on the registering screen, we return an empty string.
     * @returns String value of the email field or an empty string if
     * we are not on the register screen.
     */

    public getEmail(): string {
        if (!this.isRegistering()) return '';

        return this.emailField.val()! as string;
    }

    /**
     * Returns a static string for the loader dots. We're
     * essentially creating a `span` HTML element that
     * we can just pull when needed.
     * @returns A string containing the loader dots HTML.
     */

    public getLoaderDots(): string {
        return '<span class="loader-dot">.</span><span class="loader-dot">.</span><span class="loader-dot">.</span>';
    }

    /**
     * Handles the event of a key being initially pressed down.
     * @param callback Contains event data about the key pressed.
     */

    public onKeyDown(callback: KeyDownCallback): void {
        this.keyDownCallback = callback;
    }

    /**
     * Handles the event of a key being released.
     * @param callback Contains event data about the key released.
     */

    public onKeyUp(callback: KeyUpCallback): void {
        this.keyUpCallback = callback;
    }

    /**
     * Handles when an attempt to log in is made.
     * @param callback Data contains username, password, and email
     * if the user is registering.
     */

    public onLogin(callback: EmptyCallback): void {
        this.loginCallback = callback;
    }

    /**
     * Callback for when left mouse click occurs.
     * @param callback Event data about the left mouse click.
     */

    public onLeftClick(callback: LeftClickCallback): void {
        this.leftClickCallback = callback;
    }

    /**
     * Callback about context menu activation. Also known
     * as right click in the browser.
     * @param callback Callback containing ContextMenuData.
     */

    public onRightClick(callback: RightClickCallback): void {
        this.rightClickCallback = callback;
    }

    /**
     * Callback for whenever the mouse moves.
     * @param callback Contains mouse movement event data.
     */

    public onMouseMove(callback: MouseMoveCallback): void {
        this.mouseMoveCallback = callback;
    }

    /**
     * An empty callback signal containing a signal
     * for the renderer and various other elements
     * to undergo resizing.
     */

    public onResize(callback: EmptyCallback): void {
        this.resizeCallback = callback;
    }

    /**
     * Callback for when the respawn button is pressed.
     */

    public onRespawn(callback: EmptyCallback): void {
        this.respawnCallback = callback;
    }
}
