/* global log, Detect */

import $ from 'jquery';
import _ from 'underscore';
import './utils/util';

import Detect from './utils/detect';

import App from './app';
import Game from './game';

let app: App,
    body: JQuery<HTMLBodyElement>,
    chatInput: JQuery<HTMLInputElement>,
    game: Game;

const addClasses = () => {
    if (Detect.isWindows()) body.addClass('windows');

    if (Detect.isOpera()) body.addClass('opera');

    if (Detect.isFirefoxAndroid()) chatInput.removeAttr('placeholder');
};

const initGame = () => {
    app.sendStatus('Loading game');

    if (app.config.debug) console.info('Loading the main application...');

    game = new Game(app);
    app.setGame(game);
};

const load = () => {
    $(document).ready(() => {
        app = new App();
        body = $('body');
        chatInput = $('#chatInput');

        addClasses();
        initGame();
    });
};

load();
