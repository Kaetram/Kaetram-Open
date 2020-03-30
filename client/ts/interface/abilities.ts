import $ from 'jquery';

export default class Abilities {
    game: any;
    shortcuts: JQuery<HTMLElement>;
    constructor(game) {
        this.game = game;

        this.shortcuts = $('#abilityShortcut');
    }

    getList() {
        return this.shortcuts.find('ul');
    }
};
