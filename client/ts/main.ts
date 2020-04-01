import $ from 'jquery';

import App from './app';
import Game from './game';
import Detect from './utils/detect';

let app: App;
let body: JQuery<HTMLBodyElement>;
let chatInput: JQuery<HTMLInputElement>;
let game: Game;

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
    $(() => {
        app = new App();
        body = $('body');
        chatInput = $('#chatInput');

        addClasses();
        initGame();
    });
};

load();
