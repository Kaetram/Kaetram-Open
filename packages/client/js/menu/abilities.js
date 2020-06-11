import $ from 'jquery';

export default class Abilities {
    constructor(game) {
        this.game = game;
        this.shortcuts = $('#abilityShortcut');
    }

    getList() {
        return this.shortcuts.find('ul');
    }
}
