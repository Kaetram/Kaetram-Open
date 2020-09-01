import Page from '../page';
import Game from '../../../game';

export default class Guild extends Page {
    game: Game;
    constructor(game: Game) {
        super('#guildPage');

        this.game = game;
    }
}
