import App from './app';
import Game from './game';

import './lib/i18n';
import './lib/sentry';

/**
 * The entry point for the game. Create an instance of the game
 * and pass a new instance of the app onto it.
 */

window.addEventListener('load', () => {
    new Game(new App());
});
