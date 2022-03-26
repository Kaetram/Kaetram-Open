import App from './app';
import Game from './game';

import '../scss/main.scss';

/**
 * The entry point for the game. Create an instance of the game
 * and pass a new instance of the app onto it.
 */

new Game(new App());

// Perhaps we may not even need this class? Instead we could just do this directly in the game?
// Design choices for after the client is fully refactored.
