import $ from 'jquery';

import Game from '../game';

export default class Abilities {
    game: Game;
    shortcuts: JQuery;

    constructor(game: Game) {
        this.game = game;
        this.shortcuts = $('#abilityShortcut');
    }

    getList(): JQuery<HTMLUListElement> {
        return this.shortcuts.find('ul');
    }
}
