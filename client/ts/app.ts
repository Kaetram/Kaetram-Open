import $ from 'jquery';
import _ from 'underscore';

import config from '../data/config.json';
import Game from './game';
import Detect from './utils/detect';
import Modules from './utils/modules';

/**
 *
 */
export default class App {
    about: JQuery<HTMLElement>;
    body: JQuery<HTMLElement>;
    border: JQuery<HTMLElement>;
    cancelButton: JQuery<HTMLElement>;
    canvas: JQuery<HTMLElement>;
    config: Config;
    container: JQuery<HTMLElement>;
    createButton: JQuery<HTMLElement>;
    credits: JQuery<HTMLElement>;
    discord: JQuery<HTMLElement>;
    footer: JQuery<HTMLElement>;
    game: Game;
    git: JQuery<HTMLElement>;
    guest: JQuery<HTMLElement>;
    helpButton: JQuery<HTMLElement>;
    intro: JQuery<HTMLElement>;
    loading: JQuery<HTMLElement>;
    loggingIn: boolean;
    loginButton: JQuery<HTMLElement>;
    loginFields: Array<JQuery<HTMLElement>>;
    no: JQuery<HTMLElement>;
    orientation: string;
    parchment: JQuery<HTMLElement>;
    parchmentAnimating: boolean;
    readyCallback: (callback: Function) => void;
    registerButton: JQuery<HTMLElement>;
    registerFields: Array<JQuery<HTMLElement>>;
    rememberMe: JQuery<HTMLElement>;
    respawn: JQuery<HTMLElement>;
    statusMessage: string;
    window: JQuery<Window>;
    yes: JQuery<HTMLElement>;

    /**
     * Creates an instance of App.
     */
    constructor() {
        this.config = null;

        this.body = $('body');
        this.parchment = $('#parchment');
        this.container = $('#container');
        this.window = $(window);
        this.canvas = $('#canvas');
        this.border = $('#border');

        this.intro = $('#intro');

        this.loginButton = $('#login');
        this.createButton = $('#play');
        this.registerButton = $('#newCharacter');
        this.helpButton = $('#helpButton');
        this.cancelButton = $('#cancelButton');
        this.yes = $('#yes');
        this.no = $('#no');
        this.loading = $('.loader');

        this.respawn = $('#respawn');

        this.rememberMe = $('#rememberMe');
        this.guest = $('#guest');

        this.about = $('#toggle-about');
        this.credits = $('#toggle-credits');
        this.discord = $('#toggle-discord');
        this.git = $('#toggle-git');

        this.footer = $('footer');

        this.loginFields = [];
        this.registerFields = [];

        this.game = null;
        this.parchmentAnimating = false;
        this.loggingIn = false;

        this.sendStatus('Initializing the main app');

        this.updateOrientation();
        this.load();
    }

    load() {
        this.loginButton.click(() => {
            this.login();
        });

        this.createButton.click(() => {
            this.login();
        });

        this.registerButton.click(() => {
            this.openScroll('loadCharacter', 'createCharacter');
        });

        this.cancelButton.click(() => {
            this.openScroll('createCharacter', 'loadCharacter');
        });

        this.parchment.click(() => {
            if (
                this.parchment.hasClass('about') ||
                this.parchment.hasClass('credits') ||
                this.parchment.hasClass('git')
            ) {
                this.parchment.removeClass('about credits git');
                this.displayScroll('loadCharacter');
            }
        });

        this.about.click(() => {
            this.displayScroll('about');
        });

        this.credits.click(() => {
            this.displayScroll('credits');
        });

        this.discord.click(() => {
            window.open('https://discord.gg/MmbGAaw');
        });

        this.git.click(() => {
            this.displayScroll('git');
        });

        this.rememberMe.click(() => {
            if (!this.game || !this.game.storage) return;

            const active = this.rememberMe.hasClass('active');

            this.rememberMe.toggleClass('active');

            this.game.storage.toggleRemember(!active);
        });

        this.guest.click(() => {
            if (!this.game) return;

            this.guest.toggleClass('active');
        });

        this.respawn.click(() => {
            if (!this.game || !this.game.player || !this.game.player.dead) {
                return;
            }

            this.game.respawn();
        });

        window.scrollTo(0, 1);

        this.window.resize(() => {
            if (this.game) this.game.resize();
        });

        this.config = config;

        $(document).bind('keydown', (e) => {
            if (e.which === Modules.Keys.Enter) return false;
            return undefined;
        });

        $(document).keydown((e) => {
            const key = e.which || e.keyCode || 0;

            if (!this.game) return;

            this.body.focus();

            if (key === Modules.Keys.Enter && !this.game.started) {
                this.login();
                return;
            }

            if (this.game.started) {
                this.game.handleInput(Modules.InputType.Key, key);
            }
        });

        $(document).keyup((e) => {
            const key = e.which;

            if (!this.game || !this.game.started) return;

            this.game.input.keyUp(key);
        });

        $(document).mousemove((event: JQuery.MouseMoveEvent) => {
            if (
                !this.game ||
                !this.game.input ||
                !this.game.started ||
                event.target.id !== 'textCanvas'
            ) {
                return;
            }

            this.game.input.setCoords(event);
            this.game.input.moveCursor();
        });

        this.canvas.click((event) => {
            if (!this.game || !this.game.started || event.button !== 0) return;

            window.scrollTo(0, 1);

            this.game.input.handle(Modules.InputType.LeftClick, event);
        });

        $('input[type="range"]').on('input', () => {
            this.updateRange($(this));
        });
    }

    login() {
        if (
            this.loggingIn ||
            !this.game ||
            !this.game.loaded ||
            this.statusMessage ||
            !this.verifyForm()
        ) {
            return;
        }

        this.toggleLogin(true);
        this.game.connect();

        window.install();
    }

    fadeMenu() {
        this.updateLoader(null);

        setTimeout(() => {
            this.body.addClass('game');
            this.body.addClass('started');

            this.body.removeClass('intro');

            this.footer.hide();
        }, 500);
    }

    showMenu() {
        this.body.removeClass('game');
        this.body.removeClass('started');
        this.body.addClass('intro');

        this.footer.show();
    }

    openScroll(origin, destination) {
        if (!destination || this.loggingIn) return;

        this.cleanErrors();

        if (!Detect.isMobile()) {
            if (this.parchmentAnimating) return;

            this.parchmentAnimating = true;

            this.parchment.toggleClass('animate').removeClass(origin);

            setTimeout(
                () => {
                    this.parchment.toggleClass('animate').addClass(destination);
                    this.parchmentAnimating = false;
                },
                Detect.isTablet() ? 0 : 1000
            );
        } else this.parchment.removeClass(origin).addClass(destination);
    }

    displayScroll(content) {
        const state = this.parchment.attr('class');

        if (this.game.started) {
            this.parchment.removeClass().addClass(content);

            this.body.removeClass('credits legal about').toggleClass(content);

            if (this.game.player) this.body.toggleClass('death');

            if (content !== 'about') this.helpButton.removeClass('active');
        } else if (state !== 'animate') {
            this.openScroll(
                state,
                state === content ? 'loadCharacter' : content
            );
        }
    }

    verifyForm() {
        const activeForm = this.getActiveForm();

        if (activeForm === 'null') return;

        switch (activeForm) {
            case 'loadCharacter': {
                const nameInput = $('#loginNameInput');
                const passwordInput = $('#loginPasswordInput');

                if (this.loginFields.length === 0) {
                    this.loginFields = [nameInput, passwordInput];
                }

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
                const characterName = $('#registerNameInput');
                const registerPassword = $('#registerPasswordInput');
                const registerPasswordConfirmation = $(
                    '#registerPasswordConfirmationInput'
                );
                const email = $('#registerEmailInput');

                if (this.registerFields.length === 0) {
                    this.registerFields = [
                        characterName,
                        registerPassword,
                        registerPasswordConfirmation,
                        email,
                    ];
                }

                if (!characterName.val()) {
                    this.sendError(
                        characterName,
                        'A username is necessary you silly.'
                    );
                    return false;
                }

                if (!registerPassword.val()) {
                    this.sendError(
                        registerPassword,
                        'You must enter a password.'
                    );
                    return false;
                }

                if (
                    registerPasswordConfirmation.val() !==
                    registerPassword.val()
                ) {
                    this.sendError(
                        registerPasswordConfirmation,
                        'The passwords do not match!'
                    );
                    return false;
                }

                if (!email.val() || !this.verifyEmail(email.val())) {
                    this.sendError(email, 'An email is required!');
                    return false;
                }

                break;
            }

            default:
        }

        return true;
    }

    verifyEmail(email) {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            email
        );
    }

    sendStatus(message) {
        this.cleanErrors();

        this.statusMessage = message;

        if (!message) return;

        $('<span></span>', {
            class: 'status blink',
            text: message,
        }).appendTo('.validation-summary');

        $('.status').append(
            '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>'
        );
    }

    sendError(field, error) {
        this.cleanErrors();

        $('<span></span>', {
            class: 'validation-error blink',
            text: error,
        }).appendTo('.validation-summary');

        if (!field) return;

        field.addClass('field-error').select();
        field.bind('keypress', (event) => {
            field.removeClass('field-error');

            $('.validation-error').remove();

            $(this).unbind(event);
        });
    }

    cleanErrors() {
        const activeForm = this.getActiveForm();
        const fields =
            activeForm === 'loadCharacter'
                ? this.loginFields
                : this.registerFields;

        for (let i = 0; i < fields.length; i++) {
            fields[i].removeClass('field-error');
        }

        $('.validation-error').remove();
        $('.status').remove();
    }

    getActiveForm() {
        return this.parchment[0].className;
    }

    isRegistering() {
        return this.getActiveForm() === 'createCharacter';
    }

    isGuest() {
        return this.guest.hasClass('active');
    }

    setGame(game) {
        this.game = game;
    }

    hasWorker() {
        return !!window.Worker;
    }

    getScaleFactor() {
        return 3;
    }

    getUIScale() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        return width <= 1000 ? 1 : width <= 1500 || height <= 870 ? 2 : 3;
    }

    revertLoader() {
        this.updateLoader('Connecting');
    }

    updateLoader(message) {
        if (!message) {
            this.loading.html('');
            return;
        }

        const dots =
            '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>';
        this.loading.html(message + dots);
    }

    toggleLogin(toggle) {
        this.revertLoader();

        this.toggleTyping(toggle);

        this.loggingIn = toggle;

        if (toggle) {
            this.loading.removeAttr('hidden');

            this.loginButton.addClass('disabled');
            this.registerButton.addClass('disabled');
        } else {
            this.loading.attr('hidden', 'true');

            this.loginButton.removeClass('disabled');
            this.registerButton.removeClass('disabled');
        }
    }

    toggleTyping(state) {
        if (this.loginFields) {
            _.each(this.loginFields, (field) => {
                field.prop('readonly', state);
            });
        }

        if (this.registerFields) {
            _.each(this.registerFields, (field) => {
                field.prop('readOnly', state);
            });
        }
    }

    updateRange(obj) {
        const val =
            (obj.val() - obj.attr('min')) / (obj.attr('max') - obj.attr('min'));

        obj.css(
            'background-image',
            `${
                '-webkit-gradient(linear, left top, right top, ' + 'color-stop('
            }${val}, #4d4d4d), ` +
                `color-stop(${val}, #C5C5C5)` +
                ')'
        );
    }

    updateOrientation() {
        this.orientation = this.getOrientation();
    }

    getOrientation() {
        return window.innerHeight > window.innerWidth
            ? 'portrait'
            : 'landscape';
    }
}
