import Game from '../../../game';
import Page from '../page';

export default class Guild extends Page {
    game: Game;

    constructor(game: Game) {
        super('#guildPage');

        this.game = game;
    }
}
