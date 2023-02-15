import install from './lib/pwa';
import { isMobile } from './utils/detect';
import Storage from './utils/storage';
import Util from './utils/util';
import { onSecondaryPress } from './utils/press';

import Updates from '@kaetram/common/text/en/updates.json';

import type { SerializedServer } from '@kaetram/common/types/api';

type EmptyCallback = () => void;
type KeyDownCallback = (e: KeyboardEvent) => void;
type KeyUpCallback = (e: KeyboardEvent) => void;
type LoginCallback = (server?: SerializedServer) => void;
type LeftClickCallback = (e: MouseEvent) => void;
type RightClickCallback = (position: { x: number; y: number }) => void;
type MouseMoveCallback = (e: MouseEvent) => void;

type ValidationType = 'status' | 'validation-error' | 'validation-warning';

export default class App {
    public config = window.config;

    public storage: Storage = new Storage();

    public body: HTMLElement = document.querySelector('body')!;

    private parchment: HTMLElement = document.querySelector('#parchment')!;

    public canvas: HTMLElement = document.querySelector('#canvas')!;

    private loginForm: HTMLElement = document.querySelector('#load-character form')!;
    private registerForm: HTMLElement = document.querySelector('#create-character form')!;

    private worldsList: HTMLOListElement = document.querySelector('#worlds')!;

    private passwordConfirmation: HTMLInputElement = document.querySelector(
        '#register-password-confirmation-input'
    )!;
    private emailField: HTMLInputElement = document.querySelector('#register-email-input')!;

    private loginButton: HTMLButtonElement = document.querySelector('#login')!;
    private registerButton: HTMLButtonElement = document.querySelector('#new-account')!;
    private cancelRegister: HTMLButtonElement = document.querySelector('#cancel-register')!;
    private cancelWorlds: HTMLButtonElement = document.querySelector('#cancel-worlds')!;
    private continueWorlds: HTMLButtonElement = document.querySelector('#continue-worlds')!;

    private respawn: HTMLButtonElement = document.querySelector('#respawn')!;

    private rememberMe: HTMLInputElement = document.querySelector('#remember-me input')!;
    private guest: HTMLInputElement = document.querySelector('#guest input')!;

    private about: HTMLElement = document.querySelector('#toggle-about')!;
    private credits: HTMLElement = document.querySelector('#toggle-credits')!;

    private validation: NodeListOf<HTMLElement> = document.querySelectorAll('.validation-summary')!;
    private loading: HTMLElement = document.querySelector('.loader')!;
    private worldSelectButton: HTMLElement = document.querySelector('#world-select-button')!;
    private gameVersion: HTMLElement = document.querySelector('#game-version')!;

    private currentScroll = 'load-character';
    private parchmentAnimating = false;
    private loggingIn = false; // Used to prevent interactions when trying to log in.
    private menuHidden = false; // Used to reroute key input to the callback.

    public statusMessage = '';

    private selectedServer?: SerializedServer;

    public keyDownCallback?: KeyDownCallback;
    public keyUpCallback?: KeyUpCallback;
    public loginCallback?: LoginCallback;
    public leftClickCallback?: LeftClickCallback;
    public rightClickCallback?: RightClickCallback;
    public mouseMoveCallback?: MouseMoveCallback;
    public resizeCallback?: EmptyCallback;
    public respawnCallback?: EmptyCallback;
    public focusCallback?: EmptyCallback;

    public constructor() {
        this.sendStatus('Initializing the game client');

        this.load();
    }

    /**
     * Loads all the callbacks responsible
     * for interactions. Things such as mouse clicks,
     * keyboard presses, interaction with main menu
     * elements, etc.
     */

    private load(): void {
        this.loginForm.addEventListener('submit', this.login.bind(this));
        this.registerForm.addEventListener('submit', this.login.bind(this));

        this.registerButton.addEventListener('click', () => this.openScroll('create-character'));
        this.cancelRegister.addEventListener('click', () => this.openScroll('load-character'));

        this.cancelWorlds.addEventListener('click', () => this.openScroll('load-character'));
        this.continueWorlds.addEventListener('click', () => this.openScroll('load-character'));

        this.about.addEventListener('click', () => this.openScroll('about'));
        this.credits.addEventListener('click', () => this.openScroll('credits'));

        this.respawn.addEventListener('click', () => this.respawnCallback?.());

        this.parchment.addEventListener('click', () => {
            if (this.hasFooterOpen()) this.openScroll('load-character');
            if (this.body.classList.contains('news')) this.body.classList.remove('news');
        });

        this.worldSelectButton.addEventListener('click', () => this.openScroll('world-select'));

        this.gameVersion.textContent = `${this.config.version}${this.config.minor}`;

        // Document callbacks such as clicks and keystrokes.
        document.addEventListener('keydown', (e: KeyboardEvent) => e.key !== 'Enter');
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', (e: KeyboardEvent) => this.keyUpCallback?.(e));
        document.addEventListener('mousemove', (e: MouseEvent) => this.mouseMoveCallback?.(e));

        // Canvas callbacks
        this.canvas.addEventListener('click', (e: MouseEvent) => this.leftClickCallback?.(e));

        // Window callbacks
        window.addEventListener('resize', () => this.resizeCallback?.());

        window.addEventListener('focus', () => this.focusCallback?.());

        // Body callbacks
        onSecondaryPress(document.querySelector('#canvas')!, (position) =>
            this.rightClickCallback?.(position)
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
        this.getUsernameField().value = this.storage.getUsername();
        this.getPasswordField().value = this.storage.getPassword();

        // Set the checkmark for remember me to true.
        this.rememberMe.checked = true;
    }

    /**
     * Handler for key down input event. When the menu is hidden,
     * that is, the game has started, we redirect all input to the
     * callback function.
     * @param e Event containing key data.
     */

    public handleKeyDown(e: KeyboardEvent): void {
        if (this.isMenuHidden()) return this.keyDownCallback?.(e);

        if (e.key === 'Enter') this.login();
    }

    /**
     * Clears all the status messages and allows the
     * login button to be pressed. This function generally
     * gets called once the map has finished loading.
     */

    public ready(): void {
        this.sendStatus();

        this.loginButton.disabled = false;

        this.loadLogin();
        this.loadWorlds();

        if (!('indexedDB' in window))
            this.setValidation(
                'validation-warning',
                'Your browser does not support IndexedDB. Regions will not be cached.'
            );
    }

    /**
     * Attempts to log in by checking all the necessary fields and creating
     * a callback should all checks pass.
     */

    private login(): void {
        if (this.loggingIn || this.statusMessage || !this.verifyForm()) return;

        this.clearErrors();
        this.toggleLogin(true);

        // Creates a callback with all the fields.
        this.loginCallback?.(this.selectedServer);

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
        this.body.className = 'intro';

        this.menuHidden = false;
        this.worldSelectButton.hidden = false;
        this.gameVersion.hidden = false;
    }

    /**
     * Clears the loader and begins showing
     * the game after a 500 millisecond timeout.
     */

    public fadeMenu(): void {
        if (this.menuHidden) return;

        this.body.className = 'game';

        this.menuHidden = true;
        this.worldSelectButton.hidden = true;
        this.gameVersion.hidden = true;

        this.updateLoader();
        this.saveLogin();

        setTimeout(() => this.displayNews(), 1000);
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
            this.parchment.classList.toggle('animate');
            this.parchment.classList.remove(this.currentScroll);

            // Set a timeout for the animation before displaying data.
            window.setTimeout(() => {
                // Toggle so that we can allow changing scrolls again.
                this.parchmentAnimating = false;

                // Animate again and add the new destination scroll.
                this.parchment.classList.toggle('animate');
                this.parchment.classList.add(destination);

                // Focus on the first text field in the new scroll.
                document.querySelector<HTMLInputElement>(`#${destination} input`)?.focus();
            }, 1000);
        } else {
            this.parchment.classList.remove(this.currentScroll);
            this.parchment.classList.add(destination);
        }

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
            if (this.getEmail() !== '' && !Util.isEmail(this.getEmail()))
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

        this.setValidation('status', message);

        let status = document.querySelector('.status')!;

        if (status) status.innerHTML = message + this.getLoaderDots();
    }

    /**
     * A loader functions as a status update which is displayed
     * during the connection process. It shows black letters followed
     * by the loader dots.
     * @param message The message to display.
     */

    public updateLoader(message = ''): void {
        this.loading.innerHTML = message ? message + this.getLoaderDots() : '';
    }

    /**
     * When a new player or an update to the game has occurred we send a scroll
     * notification. In the case of a new player we welcome them to the game,
     * in the case of an update, we show the update changelog using the JSON in `common`.
     */

    public displayNews(): void {
        let title = document.querySelector('#news-title')!,
            content = document.querySelector('#news-content')!;

        if (!title || !content) return;

        // Show the default welcome screen when there is a new player.
        if (this.storage.isNew()) return this.body.classList.add('news');

        // Display new version changelogs.
        if (this.storage.newVersion) {
            title.textContent = `Kaetram ${this.config.version} Changelog`;

            let changes = Updates[this.config.version as keyof typeof Updates];

            if (!changes) return;

            content.textContent = '';

            for (let cc of changes.content) content.innerHTML += `${cc}<br>`;

            this.body.classList.add('news');
        }
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

    public sendError(error: string, field?: HTMLElement): boolean {
        if (this.isMenuHidden()) return this.storage.setError(error);

        // Clear existing errors.
        this.clearErrors();

        // Appends an error component to the validation summary.
        this.setValidation('validation-error', error);

        // Stop here if no field is specified.
        if (!field) return false;

        // Circles a field with a red border.
        field.classList.add('field-error');
        field.focus();

        let keyEvent = () => {
            // Clear the event listener.
            field.removeEventListener('keypress', keyEvent, false);

            field.classList.remove('field-error');
            document.querySelector('.validation-error')?.remove();
        };

        field.addEventListener('keypress', keyEvent);

        return false;
    }

    /**
     * Clears all the errors that may have been displayed.
     * This goes through all the fields as well as erasing
     * the messages displayed.
     */

    public clearErrors(): void {
        document.querySelector('.status')?.remove();

        this.clearValidation();

        this.getUsernameField().classList.remove('field-error');
        this.getPasswordField().classList.remove('field-error');

        this.passwordConfirmation.classList.remove('field-error');
        this.emailField.classList.remove('field-error');
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

        this.loading.hidden = !toggle;

        this.loginButton.disabled = toggle;
        this.registerButton.disabled = toggle;
    }

    /**
     * Toggles the readonly state of the input fields.
     * @param state Boolean value to set the readonly state to.
     */

    private toggleTyping(state: boolean): void {
        this.getUsernameField().readOnly = state;
        this.getPasswordField().readOnly = state;

        this.passwordConfirmation.readOnly = state;
        this.emailField.readOnly = state;
    }

    /**
     * Checks if any of the footer items (about and credits) are active.
     * @returns Whether or not parchment contains `about` or `credits`.
     */

    private hasFooterOpen(): boolean {
        return (
            this.parchment.classList.contains('about') ||
            this.parchment.classList.contains('credits')
        );
    }

    /**
     * @returns Whether or not the guest toggle is checked.
     */

    public isGuest(): boolean {
        return this.guest.checked;
    }

    /**
     * Checks if the remember me checkbox is checked.
     * @returns Whether the remember me has the checked attribute.
     */

    public isRememberMe(): boolean {
        return this.rememberMe.checked;
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
     * Checks if the main menu is currently hidden (game has started).
     * @returns Whether the menuHidden attribute is set to true.
     */

    public isMenuHidden(): boolean {
        return this.menuHidden;
    }

    /**
     * @returns The jQuery HTML element of the username field
     * depending on the currently open scroll.
     */

    private getUsernameField(): HTMLInputElement {
        return document.querySelector(
            this.isRegistering() ? '#register-name-input' : '#login-name-input'
        )!;
    }

    /**
     * Grabs the username field value from either the login screen or the register
     * screen depending on the status of the current scroll open.
     * @returns String value of the input field.
     */

    public getUsername(): string {
        return this.getUsernameField().value;
    }

    /**
     * @returns The JQuery HTML element of the password field
     * depending on the currently open scroll.
     */

    private getPasswordField(): HTMLInputElement {
        return document.querySelector(
            this.isRegistering() ? '#register-password-input' : '#login-password-input'
        )!;
    }

    /**
     * Grabs the password value from the field. Acts the same as `getUsername` in that
     * it selects the adequate field depending on the currently open scroll.
     * @returns Raw string value of the password field.
     */

    public getPassword(): string {
        return this.getPasswordField().value;
    }

    /**
     * @returns The password confirmation field input string.
     */

    private getPasswordConfirmation(): string {
        return this.passwordConfirmation.value;
    }

    /**
     * Grabs the email field input from the register screen. If we are
     * not on the registering screen, we return an empty string.
     * @returns String value of the email field or an empty string if
     * we are not on the register screen.
     */

    public getEmail(): string {
        if (!this.isRegistering()) return '';

        return this.emailField.value;
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
     * Iterates through all the validations and clears them.
     */

    private clearValidation(): void {
        for (let validation of this.validation) validation.innerHTML = '';
    }

    /**
     * Iterates through the validation summaries (on the login and register)
     * page and sets their status messages to the provided parameters.
     * @param type What type of validation we're setting the message for.
     * @param message The message we are setting for the validation.
     */

    private setValidation(type: ValidationType, message = ''): void {
        this.clearValidation();

        // Create a validation message based on type and string message.
        for (let validation of this.validation)
            validation.append(this.createValidation(type, message));
    }

    /**
     * Creates a new <span></span> DOM element with the provided type
     * and message contents.
     * @param type Validation type, status is blue, error is red.
     * @param message What to display in the message.
     */

    private createValidation(type: ValidationType, message = ''): HTMLSpanElement {
        let spanElement = document.createElement('span');

        // Type of element we are creating (status is blue, error is red).
        spanElement.classList.add(type);
        spanElement.classList.add('blink');

        // Add the message onto the span element.
        spanElement.textContent = message;

        return spanElement;
    }

    /**
     * Selects the server to connect to and displays its player count on the button.
     *
     * @param server The server to connect to.
     */

    private selectServer(server: SerializedServer): void {
        this.selectedServer = server;

        let name = this.worldSelectButton.querySelector('strong')!;
        name.textContent = `${server.name}`;

        let players = this.worldSelectButton.querySelector('span')!;
        players.textContent = `(${server.players}/${server.maxPlayers} players)`;
    }

    /**
     * Loads the list of worlds from the hub and adds them to the world select.
     * The first world in the list is automatically selected.
     */

    private async loadWorlds(): Promise<void> {
        if (!this.config.hub) return;

        // Fetch a list of servers from the hub
        let res = await fetch(`${this.config.hub}/all`).catch(() => null);

        if (!res) return this.setValidation('validation-error', 'Unable to load world list.');

        let servers: SerializedServer[] = await res.json(),
            [firstServer] = servers;

        // Check if there are no servers
        if (!firstServer)
            // Display an error message.
            return this.setValidation('validation-error', 'No servers are currently available.');

        // Select the first server
        this.selectServer(firstServer);

        // If there is only one server, then hide the world select button
        if (servers.length < 2) return;

        this.worldSelectButton.hidden = false;

        for (let i in servers) {
            let server = servers[i],
                // Create a new <li> element for each server
                li = document.createElement('li'),
                name = document.createElement('strong'),
                players = document.createElement('span');

            // If this is the first server in the list, select it and mark it as active
            if (parseInt(i) === 0) li.classList.add('active');

            name.textContent = server.name;

            players.textContent = `${server.players}/${server.maxPlayers} players`;

            li.append(name);
            li.append(players);

            // When the <li> element is clicked, select the server and update the active class
            li.addEventListener('click', () => {
                this.selectServer(server);

                this.worldsList.querySelector('li.active')?.classList.remove('active');
                li.classList.add('active');
            });

            // Add the <li> element to the list of worlds
            this.worldsList.append(li);
        }
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

    public onLogin(callback: LoginCallback): void {
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

    /**
     * Callback for when the window comes back in focus. (e.g. tab is switched)
     */

    public onFocus(callback: EmptyCallback): void {
        this.focusCallback = callback;
    }
}
