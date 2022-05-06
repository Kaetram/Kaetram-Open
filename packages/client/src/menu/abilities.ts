import $ from 'jquery';

export default class Abilities {
    public shortcuts = $('#ability-shortcut');

    public getList(): JQuery<HTMLUListElement> {
        return this.shortcuts.find('ul');
    }
}
