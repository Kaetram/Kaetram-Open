import _ from 'lodash-es';

import Menu from '../../menu';

import type Player from '../../../entity/character/player/player';
import type Task from '../../../entity/character/player/task';

export default class Tasks extends Menu {
    private questList: HTMLUListElement = document.querySelector('#quest-list > ul')!;
    private achievementList: HTMLUListElement = document.querySelector('#achievement-list > ul')!;

    public constructor() {
        super('#quest-page');
    }

    /**
     * Synchronizes the quest data with the player's quest information.
     * @param player Player object we are grabbing the quest data from.
     */

    public override synchronize(player: Player): void {
        // Clear all lists.
        this.questList.innerHTML = '';
        this.achievementList.innerHTML = '';

        // Grab task information from the player object.
        _.each(player.quests, (task: Task) => this.questList.append(this.createElement(task)));
        _.each(player.achievements, (task: Task) =>
            this.achievementList.append(this.createElement(task))
        );
    }

    /**
     * Creates a new list element based on the task data.
     * @param task Task information we are using to create the element.
     */

    private createElement(task: Task): HTMLLIElement {
        let listElement = document.createElement('li'),
            questElement = document.createElement('div'),
            name = document.createElement('div');

        // Appends the class data to the elements
        questElement.classList.add('quest-item');
        name.classList.add('quest-name');

        // Set the quest name and colour of the element.
        name.textContent = task.name;
        name.style.background = this.getColour(task);

        // Append everything together.
        questElement.append(name);
        listElement.append(questElement);

        return listElement;
    }

    /**
     * Grabs the colour of the task based on the progress.
     * Colour if the task is finished is green, if it's started
     * it's marked as yellow, and red as default if the task
     * has not been started.
     * @param task Task representing a quest or achievement.
     */

    private getColour(task: Task): string {
        if (task.isFinished()) return 'rgba(10, 255, 10, 0.3)';
        if (task.isStarted()) return 'rgba(255, 255, 10, 0.4)';

        // Red, quest hasn't been started.
        return 'rgba(255, 10, 10, 0.3)';
    }
}
