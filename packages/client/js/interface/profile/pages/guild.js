import Page from '../page';

export default class Guild extends Page {
    constructor(game) {
        super('#guildPage');

        this.game = game;
    }
}
