/* global log, Detect */

define(['jquery', './app', './game'], function($, App, Game) {

    var app, body, chatInput, game;

    var load = function() {

        $(document).ready(function() {
            app = new App();
            body = $('body');
            chatInput = $('#chatInput');

            addClasses();
            initGame();
            addListeners();
        });

    };

    var addClasses = function() {
        var self = this;

        if (Detect.isWindows())
            body.addClass('windows');

        if (Detect.isOpera())
            body.addClass('opera');

        if (Detect.isFirefoxAndroid())
            chatInput.removeAttr('placeholder');

    };

    var addListeners = function() {
        var self = this,
            resizeCheck = $('#resizeCheck');

        document.addEventListener('touchstart', function() {}, false);
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        });

        resizeCheck.bind('transitionend', app.resize.bind(app));
        resizeCheck.bind('webkitTransitionEnd', app.resize.bind(app));
        resizeCheck.bind('oTransitionEnd', app.resize.bind(app));

        $(window).on('orientationchange', function(event) {
            app.updateOrientation();
        });
    };

    var initGame = function() {

        app.onReady(function() {
            app.sendStatus('Loading game');

            game = new Game(app);
            app.setGame(game);
        });

    };


    load();
});