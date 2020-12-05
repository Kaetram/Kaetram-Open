import Game from '../../../game';
import Page from '../page';

export default class Ability extends Page {
    game: Game;

    constructor(game: Game) {
        super('#skillPage');

        this.game = game;
    }
}
