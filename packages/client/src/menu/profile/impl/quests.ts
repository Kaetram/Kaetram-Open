import _ from 'lodash';

import Menu from '../../menu';

import Player from '../../../entity/character/player/player';
import Quest from '../../../entity/character/player/quest';

export default class Quests extends Menu {
    private list: HTMLUListElement = document.querySelector('#quest-list > ul')!;

    public constructor() {
        super('#quest-page');
    }

    /**
     * Synchronizes the quest data with the player's quest information.
     * @param player Player object we are grabbing the quest data from.
     */

    public override synchronize(player: Player): void {
        this.list.innerHTML = '';

        _.each(player.quests, (quest: Quest) => this.list.append(this.createElement(quest)));
    }

    /**
     * Creates a new list element based on the quest data.
     * @param quest Quest data we are using to create the element.
     */

    private createElement(quest: Quest): HTMLLIElement {
        let listElement = document.createElement('li'),
            questElement = document.createElement('div'),
            name = document.createElement('div');

        // Appends the class data to the elements
        questElement.classList.add('quest-item');
        name.classList.add('quest-name');

        // Set the quest name and colour of the element.
        name.textContent = quest.name;
        name.style.background = this.getColour(quest);

        // Append everything together.
        questElement.append(name);
        listElement.append(questElement);

        return listElement;
    }

    /**
     * Grabs the colour of the quest based on the progress.
     * @param quest Quest to grab the colour for.
     */

    private getColour(quest: Quest): string {
        if (quest.isFinished()) return 'rgba(10, 255, 10, 0.3)';
        if (quest.isStarted()) return 'rgba(255, 255, 10, 0.4)';

        // Red, quest hasn't been started.
        return 'rgba(255, 10, 10, 0.3)';
    }
}
