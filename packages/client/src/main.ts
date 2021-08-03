import '../scss/main.scss';

import $ from 'jquery';

import App from './app';
import Game from './game';
import log from './lib/log';

let app = new App();

app.sendStatus('Loading game');

log.debug('Loading the main application...');
if (app.config.worldSwitch) $('#worlds-switch').show();

new Game(app);
