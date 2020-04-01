import Page from '../page';
import Game from '../../../game';

export default class Ability extends Page {
    constructor(public game: Game) {
        super('#skillPage');

        this.game = game;
    }

    resize() {
        // XXX: Resize for Ability
    }
}
