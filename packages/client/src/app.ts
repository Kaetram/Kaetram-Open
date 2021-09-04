import $ from 'jquery';
import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import install from './lib/pwa';
import { isMobile, isTablet } from './utils/detect';

import type Game from './game';

export interface Config {
    name: string;
    /** Server host */
    host: string;
    /** Server port */
    port: number;
    /** Game version on the server */
    version: string;
    /** Use HTTPS */
    ssl: boolean;
    debug: boolean;
    hub: string | false;
    worldSwitch: boolean;
}

export default class App {
    public config: Config;

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

        // `window.config` is replaced by vite during build process

        // eslint-disable-next-line prefer-destructuring
        let hubEnabled = window.config.hubEnabled,
            secure = window.config.ssl,
            hub = secure
                ? `https://${window.config.hubHost}`
                : `http://${window.config.hubHost}:${window.config.hubPort}`;

        this.config = {
            debug: import.meta.env.DEV,
            name: window.config.name,
            host: window.config.host,
            port: window.config.socketioPort,
            version: window.config.gver,
            ssl: secure,
            worldSwitch: hubEnabled && window.config.worldSwitch,
            hub: hubEnabled && hub
        };

        // this.updateOrientation();

        this.load();
    }

    private load(): void {
        let {
            forms,
            registerButton,
            cancelButton,
            parchment,
            about,
            credits,
            discord,
            git,
            rememberMe,
            respawn,
            body,
            canvas
        } = this;

        forms.on('submit', (event) => {
            event.preventDefault();

            this.login();
        });

        registerButton.on('click', () => this.openScroll('loadCharacter', 'createCharacter'));

        cancelButton.on('click', () => this.openScroll('createCharacter', 'loadCharacter'));

        parchment.on('click', () => {
            if (
                parchment.hasClass('about') ||
                parchment.hasClass('credits') ||
                parchment.hasClass('git')
            ) {
                parchment.removeClass('about credits git');
                this.displayScroll('loadCharacter');
            }
        });

        about.on('click', () => this.displayScroll('about'));

        credits.on('click', () => this.displayScroll('credits'));

        discord.on('click', () => window.open('https://discord.gg/MmbGAaw'));

        git.on('click', () => this.displayScroll('git'));

        rememberMe.on('change', () => {
            let { game } = this;

            if (!game.storage) return;

            let active = rememberMe.prop('checked');

            game.storage.toggleRemember(!active);
        });

        respawn.on('click', () => {
            let { game } = this;

            if (game.player.dead) game.respawn();
        });

        window.scrollTo(0, 1);

        this.window.on('resize', () => this.game.resize());

        $(document).on('keydown', ({ which }) => which !== Modules.Keys.Enter);

        $(document).on('keydown', ({ which, keyCode }) => {
            let key: Modules.Keys = which || keyCode || 0,
                { game } = this;

            if (!game) return;

            body.trigger('focus');

            if (game.started) game.handleInput(Modules.InputType.Key, key);
            else if (key === Modules.Keys.Enter) this.login();
        });

        $(document).on('keyup', ({ which }) => {
            let { game } = this,
                key = which;

            if (!game || !game.started) return;

            game.input.keyUp(key);
        });

        $(document).on('mousemove', (event: JQuery.MouseMoveEvent<Document>) => {
            let { game } = this;

            if (!game || !game.input || !game.started || event.target.id !== 'textCanvas') return;

            game.input.setCoords(event);
            game.input.moveCursor();
        });

        $('body').on('contextmenu', '#canvas', (event) => {
            this.game.input.handle(Modules.InputType.RightClick, event);

            return false;
        });

        canvas.on('click', (event) => {
            let { game } = this;

            if (!game || !game.started || event.button !== 0) return;

            window.scrollTo(0, 1);

            game.input.handle(Modules.InputType.LeftClick, event);
        });

        $('input[type="range"]').on('input', (_e, input: HTMLInputElement) =>
            this.updateRange($(input))
        );

        if (location.hostname === 'kaetram.com')
            $.ajax({
                url: 'https://c6.patreon.com/becomePatronButton.bundle.js',
                dataType: 'script',
                async: true
            });
    }

    public ready(): void {
        this.sendStatus(null);

        this.loaded = true;

        this.loginButton.prop('disabled', false);
    }

    private login(): void {
        let { loggingIn, loaded, statusMessage, game } = this;

        if (loggingIn || !loaded || statusMessage || !this.verifyForm()) return;

        this.toggleLogin(true);
        game.connect();

        install();
    }

    public fadeMenu(): void {
        let { body, footer } = this;

        this.updateLoader(null);

        window.setTimeout(() => {
            body.addClass('game');
            body.addClass('started');

            body.removeClass('intro');

            footer.hide();
        }, 500);
    }

    public showMenu(): void {
        let { body, footer } = this;

        body.removeClass('game');
        body.removeClass('started');
        body.addClass('intro');

        footer.show();
    }

    // showDeath(): void {}

    public openScroll(origin: string | undefined, destination: string): void {
        let { loggingIn, parchmentAnimating, parchment } = this;

        if (!destination || loggingIn) return;

        this.cleanErrors();

        if (!isMobile()) {
            if (parchmentAnimating) return;

            this.parchmentAnimating = true;

            parchment.toggleClass('animate').removeClass(origin);

            window.setTimeout(
                () => {
                    parchment.toggleClass('animate').addClass(destination);
                    this.parchmentAnimating = false;

                    $(`#${destination} input`)[0]?.focus();
                },
                isTablet() ? 0 : 1000
            );
        } else parchment.removeClass(origin).addClass(destination);
    }

    private displayScroll(content: string): void {
        let { parchment, game, body, helpButton } = this,
            state = parchment.attr('class');

        if (game.started) {
            parchment.removeClass().addClass(content);

            body.removeClass('credits legal about').toggleClass(content);

            if (game.player) body.toggleClass('death');

            if (content !== 'about') helpButton.removeClass('active');
        } else if (state !== 'animate')
            this.openScroll(state, state === content ? 'loadCharacter' : content);
    }

    private verifyForm(): boolean {
        let activeForm = this.getActiveForm();

        if (activeForm === 'null') return false;

        switch (activeForm) {
            case 'loadCharacter': {
                let nameInput: JQuery<HTMLInputElement> = $('#loginNameInput'),
                    passwordInput: JQuery<HTMLInputElement> = $('#loginPasswordInput');

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
                let characterName: JQuery<HTMLInputElement> = $('#registerNameInput'),
                    registerPassword: JQuery<HTMLInputElement> = $('#registerPasswordInput'),
                    registerPasswordConfirmation: JQuery<HTMLInputElement> = $(
                        '#registerPasswordConfirmationInput'
                    ),
                    email: JQuery<HTMLInputElement> = $('#registerEmailInput');

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
        let activeForm = this.getActiveForm(),
            fields = activeForm === 'loadCharacter' ? this.loginFields : this.registerFields;

        for (let i = 0; i < fields.length; i++) fields[i].removeClass('field-error');

        $('.validation-error').remove();
        $('.status').remove();
    }

    private getActiveForm() {
        return this.parchment[0].className as 'null' | 'loadCharacter' | 'createCharacter';
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

    public getScaleFactor(): number {
        return 3;
    }

    public getUIScale(): number {
        let width = window.innerWidth,
            height = window.innerHeight;

        return width <= 1000 ? 1 : width <= 1500 || height <= 870 ? 2 : 3;
    }

    private revertLoader(): void {
        this.updateLoader('Connecting');
    }

    public updateLoader(message: string | null): void {
        let { loading } = this;

        if (message) {
            let dots =
                '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>';

            loading.html(message + dots);
        } else loading.html('');
    }

    public toggleLogin(toggle: boolean): void {
        let { loading, loginButton, registerButton } = this;

        this.revertLoader();

        this.toggleTyping(toggle);

        this.loggingIn = toggle;

        if (toggle) loading.removeAttr('hidden');
        else loading.attr('hidden', 'true');

        loginButton.prop('disabled', toggle);
        registerButton.prop('disabled', toggle);
    }

    private toggleTyping(state: boolean): void {
        let { loginFields, registerFields } = this;

        if (loginFields) _.each(loginFields, (field) => field.prop('readonly', state));

        if (registerFields) _.each(registerFields, (field) => field.prop('readOnly', state));
    }

    public updateRange(obj: JQuery<HTMLInputElement>): void {
        let min = parseInt(obj.attr('min')!),
            max = parseInt(obj.attr('max')!),
            val = (parseInt(obj.val() as string) - min) / (max - min);

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
