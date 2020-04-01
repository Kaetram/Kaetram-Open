import $ from 'jquery';

import Game from '../game';

export default class Abilities {
    shortcuts: JQuery<HTMLElement>;

    constructor(public game: Game) {
        this.game = game;

        this.shortcuts = $('#abilityShortcut');
    }

    getList() {
        return this.shortcuts.find('ul');
    }
}
