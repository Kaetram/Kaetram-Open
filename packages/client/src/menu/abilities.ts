import $ from 'jquery';

export default class Abilities {
    public shortcuts = $('#abilityShortcut');

    public getList(): JQuery<HTMLUListElement> {
        return this.shortcuts.find('ul');
    }
}
