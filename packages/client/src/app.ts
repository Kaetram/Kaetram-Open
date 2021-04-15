import $ from 'jquery';
import _ from 'lodash';

import install from './lib/pwa';
import Game from './game';
import { isMobile, isTablet } from './utils/detect';
import * as Modules from '@kaetram/common/src/modules';

export interface Config {
    /** Server host */
    ip: string;
    /** Server port */
    port: number;
    /** Game version on the server */
    version: string;
    /** Use HTTPS */
    ssl: boolean;
    debug: boolean;
    worldSwitch: boolean;
}

export default class App {
    // Do not refactor env variables assignment
    // `process.env.VARIABLE` is replaced by webpack during build process
    public config: Config = {
        ip: process.env.IP as string,
        port: parseInt(process.env.PORT as string),
        version: process.env.VERSION as string,
        ssl: !!process.env.SSL,
        debug: process.env.NODE_ENV === 'development',
        worldSwitch: !!process.env.WORLD_SWITCH
    };

    public body = $('body');

    private parchment = $('#parchment');
    private window = $(window);

    public canvas = $('#canvas');
    public border = $('#border');

    private forms = $('#intro form');

    private loginButton = $('#login');
    // private createButton = $('#play');
    private registerButton = $('#newCharacter');
    private helpButton = $('#helpButton');
    private cancelButton = $('#cancelButton');
    private loading = $('.loader');

    private respawn = $('#respawn');

    private rememberMe = $('#rememberMe input');
    private guest = $('#guest input');

    private about = $('#toggle-about');
    private credits = $('#toggle-credits');
    private discord = $('#toggle-discord');
    private git = $('#toggle-git');

    private footer = $('footer');

    public loginFields: JQuery<HTMLInputElement>[] = [];
    public registerFields: JQuery<HTMLInputElement>[] = [];

    public game!: Game;

    private loaded = false;

    private parchmentAnimating = false;
    private loggingIn = false;

    public statusMessage!: string | null;
    // orientation: string;

    public constructor() {
        this.sendStatus('Initializing the main app');

        // this.updateOrientation();
        this.load();
    }

    private load(): void {
        this.forms.on('submit', (e) => {
            e.preventDefault();

            this.login();
        });

        this.registerButton.on('click', () => this.openScroll('loadCharacter', 'createCharacter'));

        this.cancelButton.on('click', () => this.openScroll('createCharacter', 'loadCharacter'));

        this.parchment.on('click', () => {
            if (
                this.parchment.hasClass('about') ||
                this.parchment.hasClass('credits') ||
                this.parchment.hasClass('git')
            ) {
                this.parchment.removeClass('about credits git');
                this.displayScroll('loadCharacter');
            }
        });

        this.about.on('click', () => this.displayScroll('about'));

        this.credits.on('click', () => this.displayScroll('credits'));

        this.discord.on('click', () => window.open('https://discord.gg/MmbGAaw'));

        this.git.on('click', () => this.displayScroll('git'));

        this.rememberMe.on('change', () => {
            if (!this.game?.storage) return;

            const active = this.rememberMe.prop('checked');

            this.game.storage.toggleRemember(!active);
        });

        this.respawn.on('click', () => {
            if (this.game?.player?.dead) this.game.respawn();
        });

        window.scrollTo(0, 1);

        this.window.on('resize', () => this.game.resize());

        // Default Server ID
        if (!window.localStorage.getItem('world'))
            window.localStorage.setItem('world', 'kaetram_server01');

        if (this.config.worldSwitch)
            $.get('https://hub.kaetram.com/all', (servers) => {
                let serverIndex = 0;
                for (const [i, server] of servers.entries()) {
                    const row = $(document.createElement('tr'));
                    row.append($(document.createElement('td')).text(server.serverId));
                    row.append(
                        $(document.createElement('td')).text(
                            `${server.playerCount}/${server.maxPlayers}`
                        )
                    );
                    $('#worlds-list').append(row);
                    row.on('click', () => {
                        // TODO: This is when a server is clicked with the local `server` having the world data.
                        // log.info(server);
                    });

                    if (server.serverId === window.localStorage.getItem('world')) serverIndex = i;
                }
                const currentWorld = servers[serverIndex];

                $('#current-world-index').text(serverIndex);
                $('#current-world-id').text(currentWorld.serverId);
                $('#current-world-count').text(
                    `${currentWorld.playerCount}/${currentWorld.maxPlayers}`
                );

                $('#worlds-switch').on('click', () => $('#worlds-popup').toggle());
            });

        $(document).on('keydown', (e) => {
            if (e.which === Modules.Keys.Enter) return false;
        });

        $(document).on('keydown', (e) => {
            const key = e.which || e.keyCode || 0;

            if (!this.game) return;

            this.body.trigger('focus');

            if (this.game.started) this.game.handleInput(Modules.InputType.Key, key);
        });

        $(document).on('keyup', (e) => {
            const key = e.which;

            if (!this.game || !this.game.started) return;

            this.game?.input?.keyUp(key);
        });

        $(document).on('mousemove', (event: JQuery.MouseMoveEvent<Document>) => {
            if (
                !this.game ||
                !this.game.input ||
                !this.game.started ||
                event.target.id !== 'textCanvas'
            )
                return;

            this.game.input.setCoords(event);
            this.game.input.moveCursor();
        });

        $('body').on('contextmenu', '#canvas', (event) => {
            this.game?.input?.handle(Modules.InputType.RightClick, event);

            return false;
        });

        this.canvas.on('click', (event) => {
            if (!this.game || !this.game.started || event.button !== 0) return;

            window.scrollTo(0, 1);

            this.game?.input?.handle(Modules.InputType.LeftClick, event);
        });

        $('input[type="range"]').on('input', (_e, input: HTMLInputElement) =>
            this.updateRange($(input))
        );
    }

    public ready(): void {
        this.sendStatus(null);

        this.loaded = true;

        this.loginButton.prop('disabled', false);
    }

    private login(): void {
        if (this.loggingIn || !this.loaded || this.statusMessage || !this.verifyForm()) return;

        this.loaded = false;

        this.toggleLogin(true);
        this.game.connect();

        install();
    }

    public fadeMenu(): void {
        this.updateLoader(null);

        window.setTimeout(() => {
            this.body.addClass('game');
            this.body.addClass('started');

            this.body.removeClass('intro');

            this.footer.hide();
        }, 500);
    }

    public showMenu(): void {
        this.body.removeClass('game');
        this.body.removeClass('started');
        this.body.addClass('intro');

        this.footer.show();
    }

    // showDeath(): void {}

    public openScroll(origin: string | undefined, destination: string): void {
        if (!destination || this.loggingIn) return;

        this.cleanErrors();

        if (!isMobile()) {
            if (this.parchmentAnimating) return;

            this.parchmentAnimating = true;

            this.parchment.toggleClass('animate').removeClass(origin);

            window.setTimeout(
                () => {
                    this.parchment.toggleClass('animate').addClass(destination);
                    this.parchmentAnimating = false;

                    $(`#${destination} input`)[0]?.focus();
                },
                isTablet() ? 0 : 1000
            );
        } else this.parchment.removeClass(origin).addClass(destination);
    }

    private displayScroll(content: string): void {
        const state = this.parchment.attr('class');

        if (this.game.started) {
            this.parchment.removeClass().addClass(content);

            this.body.removeClass('credits legal about').toggleClass(content);

            if (this.game.player) this.body.toggleClass('death');

            if (content !== 'about') this.helpButton.removeClass('active');
        } else if (state !== 'animate')
            this.openScroll(state, state === content ? 'loadCharacter' : content);
    }

    private verifyForm(): boolean {
        const activeForm = this.getActiveForm();

        if (activeForm === 'null') return false;

        switch (activeForm) {
            case 'loadCharacter': {
                const nameInput: JQuery<HTMLInputElement> = $('#loginNameInput');
                const passwordInput: JQuery<HTMLInputElement> = $('#loginPasswordInput');

                if (this.loginFields.length === 0) this.loginFields = [nameInput, passwordInput];

                if (!nameInput.val() && !this.isGuest()) {
                    this.sendError(nameInput, 'Please enter a username.');
                    return false;
                }

                if (!passwordInput.val() && !this.isGuest()) {
                    this.sendError(passwordInput, 'Please enter a password.');
                    return false;
                }

                break;
            }

            case 'createCharacter': {
                const characterName: JQuery<HTMLInputElement> = $('#registerNameInput');
                const registerPassword: JQuery<HTMLInputElement> = $('#registerPasswordInput');
                const registerPasswordConfirmation: JQuery<HTMLInputElement> = $(
                    '#registerPasswordConfirmationInput'
                );
                const email: JQuery<HTMLInputElement> = $('#registerEmailInput');

                if (this.registerFields.length === 0)
                    this.registerFields = [
                        characterName,
                        registerPassword,
                        registerPasswordConfirmation,
                        email
                    ];

                if (!characterName.val()) {
                    this.sendError(characterName, 'A username is necessary you silly.');
                    return false;
                }

                if (!registerPassword.val()) {
                    this.sendError(registerPassword, 'You must enter a password.');
                    return false;
                }

                if (registerPasswordConfirmation.val() !== registerPassword.val()) {
                    this.sendError(registerPasswordConfirmation, 'The passwords do not match!');
                    return false;
                }

                if (!email.val() || !this.verifyEmail(email.val() as string)) {
                    this.sendError(email, 'An email is required!');
                    return false;
                }

                break;
            }
        }

        return true;
    }

    private verifyEmail(email: string): boolean {
        return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(
            email
        );
    }

    public sendStatus(message: string | null): void {
        this.cleanErrors();

        this.statusMessage = message;

        if (!message) return;

        $('<span></span>', {
            class: 'status blink',
            text: message
        }).appendTo('.validation-summary');

        $('.status').append(
            '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>'
        );
    }

    public sendError(field: JQuery | null, error: string): void {
        this.cleanErrors();

        $('<span></span>', {
            class: 'validation-error blink',
            text: error
        }).appendTo('.validation-summary');

        if (!field) return;

        field.addClass('field-error').trigger('select');
        field.on('keypress', function (event) {
            field.removeClass('field-error');

            $('.validation-error').remove();

            $(this).off(event);
        });
    }

    public cleanErrors(): void {
        const activeForm = this.getActiveForm();
        const fields = activeForm === 'loadCharacter' ? this.loginFields : this.registerFields;

        for (let i = 0; i < fields.length; i++) fields[i].removeClass('field-error');

        $('.validation-error').remove();
        $('.status').remove();
    }

    private getActiveForm(): string {
        return this.parchment[0].className;
    }

    public isRegistering(): boolean {
        return this.getActiveForm() === 'createCharacter';
    }

    public isGuest(): boolean {
        return this.guest.prop('checked');
    }

    public setGame(game: Game): void {
        this.game = game;
    }

    public hasWorker(): boolean {
        return !!window.Worker;
    }

    public getScaleFactor(): number {
        return 3;
    }

    public getUIScale(): number {
        const width = window.innerWidth;
        const height = window.innerHeight;

        return width <= 1000 ? 1 : width <= 1500 || height <= 870 ? 2 : 3;
    }

    private revertLoader(): void {
        this.updateLoader('Connecting');
    }

    public updateLoader(message: string | null): void {
        if (message) {
            const dots =
                '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>';

            this.loading.html(message + dots);
        } else this.loading.html('');
    }

    public toggleLogin(toggle: boolean): void {
        this.revertLoader();

        this.toggleTyping(toggle);

        this.loggingIn = toggle;

        if (toggle) this.loading.removeAttr('hidden');
        else this.loading.attr('hidden', 'true');

        this.loginButton.prop('disabled', toggle);
        this.registerButton.prop('disabled', toggle);
    }

    private toggleTyping(state: boolean): void {
        if (this.loginFields) _.each(this.loginFields, (field) => field.prop('readonly', state));

        if (this.registerFields)
            _.each(this.registerFields, (field) => field.prop('readOnly', state));
    }

    public updateRange(obj: JQuery<HTMLInputElement>): void {
        const min = parseInt(obj.attr('min') as string);
        const val =
            (parseInt(obj.val() as string) - min) / (parseInt(obj.attr('max') as string) - min);

        obj.css({
            backgroundImage: `-webkit-gradient(linear, left top, right top, color-stop(${val}, #4d4d4d), color-stop(${val}, #c5c5c5))`
        });
    }

    // updateOrientation(): void {
    //     this.orientation = this.getOrientation();
    // }

    // getOrientation(): 'portrait' | 'landscape' {
    //     return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    // }
}
