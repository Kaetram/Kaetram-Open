import $ from 'jquery';
import App from './app';
import Game from './game';
import log from './lib/log';
import * as Detect from './utils/detect';

var app, body, chatInput, game;

var load = function () {
    $(document).ready(function () {
        app = new App();
        body = $('body');
        chatInput = $('#chatInput');

        addClasses();
        initGame();
    });
};

var addClasses = function () {
    var self = this;

    if (Detect.isWindows()) body.addClass('windows');

    if (Detect.isOpera()) body.addClass('opera');

    if (Detect.isFirefoxAndroid()) chatInput.removeAttr('placeholder');
};

var initGame = function () {
    app.sendStatus('Loading game');

    if (app.config.debug) log.info('Loading the main application...');
    if (app.config.worldSwitch) $('#worlds-switch').show();

    game = new Game(app);
    app.setGame(game);
};

load();
