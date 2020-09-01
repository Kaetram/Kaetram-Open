import $ from 'jquery';
import App from './app';
import Game from './game';
import log from './lib/log';
import * as Detect from './utils/detect';

let app: App, body: JQuery<HTMLBodyElement>, chatInput: JQuery<HTMLInputElement>, game: Game;

const load = () => {
    $(() => {
        app = new App();
        body = $('body');
        chatInput = $('#chatInput');

        addClasses();
        initGame();
    });
};

function addClasses() {
    if (Detect.isWindows()) body.addClass('windows');

    if (Detect.isOpera()) body.addClass('opera');

    if (Detect.isFirefoxAndroid()) chatInput.removeAttr('placeholder');
}

function initGame() {
    app.sendStatus('Loading game');

    if (app.config.debug) log.info('Loading the main application...');
    if (app.config.worldSwitch) $('#worlds-switch').show();

    game = new Game(app);
    app.setGame(game);
}

load();
