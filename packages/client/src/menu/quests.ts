import Menu from './menu';

import Player from '../entity/character/player/player';

export default class Quests extends Menu {
    // Contains the list of all the quests and their respective status.
    private list: HTMLUListElement = document.querySelector('#quests-container > ul')!;

    // Contains information about a selected quest.
    private log: HTMLElement = document.querySelector('#quest-log')!;

    public constructor(private player: Player) {
        super('#quests', '#close-quests', '#quests-button');
    }
}
