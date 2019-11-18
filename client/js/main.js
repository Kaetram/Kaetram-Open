/* global log, Detect */

define(['jquery', './app', './game'], function($, App, Game) {
    var app, body, chatInput, game;

    var install = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(choiceResult) {
                if (choiceResult.outcome === 'accepted')
                    log.info('Your PWA has been installed');
                else log.info('User chose to not install your PWA');

                deferredPrompt = null;
            });
        }
    };
    var load = function() {
        $(document).ready(function() {
            app = new App();
            body = $('body');
            chatInput = $('#chatInput');

            addClasses();
            initGame();
        });

        // This is the "Offline page" service worker

        // Add this below content to your HTML page, or add the js file to your page at the very top to register service worker

        // Check compatibility for the browser we're running this in
        if ('serviceWorker' in navigator) {
            if (navigator.serviceWorker.controller) {
                log.info(
                    '[PWA Builder] active service worker found, no need to register'
                );
            } else {
                // Register the service worker
                navigator.serviceWorker
                    .register('sw.js', {
                        scope: '../'
                    })
                    .then(function(reg) {
                        log.info(
                            '[PWA Builder] Service worker has been registered for scope: ' +
                                reg.scope
                        );
                    });
            }
        }

        window.addEventListener('beforeinstallprompt', function(e) {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();

            // Stash the event so it can be triggered later.
            deferredPrompt = e;

            install();
        });
    };

    var addClasses = function() {
        var self = this;

        if (Detect.isWindows()) body.addClass('windows');

        if (Detect.isOpera()) body.addClass('opera');

        if (Detect.isFirefoxAndroid()) chatInput.removeAttr('placeholder');
    };

    var initGame = function() {
        app.onReady(function() {
            app.sendStatus('Loading game');

            if (app.config.debug) log.info('Loading the main application...');

            game = new Game(app);
            app.setGame(game);
        });
    };

    load();
});
