import Page from '../page';
import Game from '../../../game';

export default class Ability extends Page {
    game: Game;

    constructor(game: Game) {
        super('#skillPage');

        this.game = game;
    }
}
