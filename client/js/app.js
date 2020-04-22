/* global log, Class, Detect, Modules */

define(['jquery'], function($) {

    return Class.extend({

        init: function() {
            var self = this;

            self.config = null;

            self.body = $('body');
            self.parchment = $('#parchment');
            self.container = $('#container');
            self.window = $(window);
            self.canvas = $('#canvas');
            self.border = $('#border');

            self.intro = $('#intro');

            self.loginButton = $('#login');
            self.createButton = $('#play');
            self.registerButton = $('#newCharacter');
            self.helpButton = $('#helpButton');
            self.cancelButton = $('#cancelButton');
            self.yes = $('#yes');
            self.no = $('#no');
            self.loading = $('.loader');

            self.respawn = $('#respawn');

            self.rememberMe = $('#rememberMe');
            self.guest = $('#guest');

            self.about = $('#toggle-about');
            self.credits = $('#toggle-credits');
            self.discord = $('#toggle-discord');
            self.git = $('#toggle-git');

            self.footer = $('footer');

            self.loginFields = [];
            self.registerFields = [];

            self.game = null;
            self.parchmentAnimating = false;
            self.loggingIn = false;

            self.sendStatus('Initializing the main app');

            self.updateOrientation();
            self.load();

        },

        load: function() {
            var self = this;

            self.loginButton.click(function() {
                self.login();
            });

            self.createButton.click(function() {
                self.login();
            });

            self.registerButton.click(function() {
                self.openScroll('loadCharacter', 'createCharacter');
            });

            self.cancelButton.click(function() {
                self.openScroll('createCharacter', 'loadCharacter');
            });

            self.parchment.click(function() {
                if (self.parchment.hasClass('about') || self.parchment.hasClass('credits') || self.parchment.hasClass('git')) {

                    self.parchment.removeClass('about credits git');
                    self.displayScroll('loadCharacter');

                }
            });

            self.about.click(function() {
                self.displayScroll('about');
            });

            self.credits.click(function() {
                self.displayScroll('credits');
            });

            self.discord.click(function() {
                window.open('https://discord.gg/MmbGAaw');
            });

            self.git.click(function() {
                self.displayScroll('git');
            });

            self.rememberMe.click(function() {
                if (!self.game || !self.game.storage)
                    return;

                var active = self.rememberMe.hasClass('active');

                self.rememberMe.toggleClass('active');

                self.game.storage.toggleRemember(!active);
            });

            self.guest.click(function() {
                if (!self.game)
                    return;

                self.guest.toggleClass('active');
            });

            self.respawn.click(function() {
                if (!self.game || !self.game.player || !self.game.player.dead)
                    return;

                self.game.respawn();
            });

            window.scrollTo(0, 1);

            self.window.resize(function() {
                if (self.game)
                    self.game.resize();
            });

            // Default Server ID
            if (!window.localStorage.getItem('world')) window.localStorage.setItem('world', 'kaetram_server01');

            $.get('https://hub.kaetram.com/all', function(servers) {
                var serverIndex;
                for (var i = 0; i < servers.length; i++) {
                    var server = servers[i];

                    var row = $(document.createElement('tr'));
                    row.append($(document.createElement('td')).text(server.serverId))
                    row.append($(document.createElement('td')).text(server.playerCount + '/' + server.maxPlayers));
                    $('#worlds-list').append(row);
                    row.click(function() {
                        // TODO: This is when a server is clicked with the local `server` having the world data.
                        // log.info(server);
                    });

                    if (server.serverId === window.localStorage.getItem('world')) {
                        serverIndex = i;
                    }
                }
                var currentWorld = servers[serverIndex];

                $('#current-world-index').text(serverIndex);
                $('#current-world-id').text(currentWorld.serverId);
                $('#current-world-count').text(currentWorld.playerCount + '/' + currentWorld.maxPlayers);

                $('#worlds-switch').click(function() {
                    $('#worlds-popup').toggle();
                });
            });

            $.getJSON('data/config.json', function(json) {
                self.config = json;

                if (self.readyCallback)
                    self.readyCallback();
            });

            $(document).bind('keydown', function(e) {
                if (e.which === Modules.Keys.Enter)
                    return false;
            });

            $(document).keydown(function(e) {
                var key = e.which || e.keyCode || 0;

                if (!self.game)
                    return;

                self.body.focus();

                if (key === Modules.Keys.Enter && !self.game.started) {
                    self.login();
                    return;
                }

                if (self.game.started)
                    self.game.handleInput(Modules.InputType.Key, key);

            });

            $(document).keyup(function(e) {
                var key = e.which;

                if (!self.game || !self.game.started)
                    return;

                self.game.input.keyUp(key);
            });

            $(document).mousemove(function(event) {
                if (!self.game || !self.game.input || !self.game.started || event.target.id !== 'textCanvas')
                    return;

                self.game.input.setCoords(event);
                self.game.input.moveCursor();
            });

            $('body').on('contextmenu', '#canvas', function(event) {


                if (self.game && self.game.input)
                    self.game.input.handle(Modules.InputType.RightClick, event);

                return false;
            });

            self.canvas.click(function(event) {
                if (!self.game || !self.game.started || event.button !== 0)
                    return;

                window.scrollTo(0, 1);

                self.game.input.handle(Modules.InputType.LeftClick, event);

            });

            $('input[type="range"]').on('input', function() {
                self.updateRange($(this));
            });

        },

        login: function() {
            var self = this;

            if (self.loggingIn || !self.game || !self.game.loaded || self.statusMessage || !self.verifyForm())
                return;

            self.toggleLogin(true);
            self.game.connect();

            install();
        },

        fadeMenu: function() {
            var self = this;

            self.updateLoader(null);

            setTimeout(function() {
                self.body.addClass('game');
                self.body.addClass('started');

                self.body.removeClass('intro');

                self.footer.hide();

            }, 500);
        },

        showMenu: function() {
            var self = this;

            self.body.removeClass('game');
            self.body.removeClass('started');
            self.body.addClass('intro');

            self.footer.show();
        },

        showDeath: function() {

        },

        openScroll: function(origin, destination) {
            var self = this;

            if (!destination || self.loggingIn)
                return;

            self.cleanErrors();

            if (!Detect.isMobile()) {
                if (self.parchmentAnimating)
                    return;

                self.parchmentAnimating = true;

                self.parchment.toggleClass('animate').removeClass(origin);

                setTimeout(function() {

                    self.parchment.toggleClass('animate').addClass(destination);
                    self.parchmentAnimating = false;

                }, Detect.isTablet() ? 0 : 1000);

            } else
                self.parchment.removeClass(origin).addClass(destination);
        },

        displayScroll: function(content) {
            var self = this,
                state = self.parchment.attr('class');

            if (self.game.started) {

                self.parchment.removeClass().addClass(content);

                self.body.removeClass('credits legal about').toggleClass(content);

                if (self.game.player)
                    self.body.toggleClass('death');

                if (content !== 'about')
                    self.helpButton.removeClass('active');

            } else if (state !== 'animate')
                self.openScroll(state, state === content ? 'loadCharacter' : content);

        },

        verifyForm: function() {
            var self = this,
                activeForm = self.getActiveForm();

            if (activeForm === 'null')
                return;

            switch (activeForm) {

                case 'loadCharacter':

                    var nameInput = $('#loginNameInput'),
                        passwordInput = $('#loginPasswordInput');

                    if (self.loginFields.length === 0)
                        self.loginFields = [nameInput, passwordInput];

                    if (!nameInput.val() && !self.isGuest()) {
                        self.sendError(nameInput, 'Please enter a username.');
                        return false;
                    }

                    if (!passwordInput.val() && !self.isGuest()) {
                        self.sendError(passwordInput, 'Please enter a password.');
                        return false;
                    }

                    break;

                case 'createCharacter':

                    var characterName = $('#registerNameInput'),
                        registerPassword = $('#registerPasswordInput'),
                        registerPasswordConfirmation = $('#registerPasswordConfirmationInput'),
                        email = $('#registerEmailInput');

                    if (self.registerFields.length === 0)
                        self.registerFields = [characterName, registerPassword, registerPasswordConfirmation, email];

                    if (!characterName.val()) {
                        self.sendError(characterName, 'A username is necessary you silly.');
                        return false;
                    }

                    if (!registerPassword.val()) {
                        self.sendError(registerPassword, 'You must enter a password.');
                        return false;
                    }

                    if (registerPasswordConfirmation.val() !== registerPassword.val()) {
                        self.sendError(registerPasswordConfirmation, 'The passwords do not match!');
                        return false;
                    }

                    if (!email.val() || !self.verifyEmail(email.val())) {
                        self.sendError(email, 'An email is required!');
                        return false;
                    }

                    break;
            }

            return true;
        },

        verifyEmail: function(email) {
            return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
        },

        sendStatus: function(message) {
            var self = this;

            self.cleanErrors();

            self.statusMessage = message;

            if (!message)
                return;

            $('<span></span>', {
                'class': 'status blink',
                text: message
            }).appendTo('.validation-summary');

            $('.status').append('<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>');
        },

        sendError: function(field, error) {
            this.cleanErrors();

            $('<span></span>', {
                'class': 'validation-error blink',
                text: error
            }).appendTo('.validation-summary');

            if (!field)
                return;

            field.addClass('field-error').select();
            field.bind('keypress', function(event) {
                field.removeClass('field-error');

                $('.validation-error').remove();

                $(this).unbind(event);
            });
        },

        cleanErrors: function() {
            var self = this,
                activeForm = self.getActiveForm(),
                fields = activeForm === 'loadCharacter' ? self.loginFields : self.registerFields;

            for (var i = 0; i < fields.length; i++)
                fields[i].removeClass('field-error');

            $('.validation-error').remove();
            $('.status').remove();
        },

        getActiveForm: function() {
            return this.parchment[0].className;
        },

        isRegistering: function() {
            return this.getActiveForm() === 'createCharacter';
        },

        isGuest: function() {
            return this.guest.hasClass('active');
        },

        setGame: function(game) {
            this.game = game;
        },

        hasWorker: function() {
            return !!window.Worker;
        },

        getScaleFactor: function() {
            return 3;
        },

        getUIScale: function() {
            var width = window.innerWidth,
                height = window.innerHeight;

            return width <= 1000 ? 1 : ((width <= 1500 || height <= 870) ? 2 : 3);
        },

        revertLoader: function() {
            this.updateLoader('Connecting');
        },

        updateLoader: function(message) {
            var self = this;

            if (!message) {
                self.loading.html('');
                return;
            }

            var dots = '<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>';
            self.loading.html(message + dots);
        },

        toggleLogin: function(toggle) {
            var self = this;

            self.revertLoader();

            self.toggleTyping(toggle);

            self.loggingIn = toggle;

            if (toggle) {
                self.loading.removeAttr('hidden');

                self.loginButton.addClass('disabled');
                self.registerButton.addClass('disabled');

            } else {
                self.loading.attr('hidden', true);

                self.loginButton.removeClass('disabled');
                self.registerButton.removeClass('disabled');
            }
        },

        toggleTyping: function(state) {
            var self = this;

            if (self.loginFields)
                _.each(self.loginFields, function(field) { field.prop('readonly', state); });

            if (self.registerFields)
                _.each(self.registerFields, function(field) { field.prop('readOnly', state); });
        },

        updateRange: function(obj) {
            var self = this,
                val = (obj.val() - obj.attr('min')) / (obj.attr('max') - obj.attr('min'));

            obj.css('background-image',
                '-webkit-gradient(linear, left top, right top, '
                + 'color-stop(' + val + ', #4d4d4d), '
                + 'color-stop(' + val + ', #C5C5C5)'
                + ')'
            );
        },

        updateOrientation: function() {
            this.orientation = this.getOrientation();
        },

        getOrientation: function() {
            return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        },

        onReady: function(callback) {
            this.readyCallback = callback;
        }

    });

});
