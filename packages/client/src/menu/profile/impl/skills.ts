import Menu from '../../menu';

import _ from 'lodash-es';

import type Player from '../../../entity/character/player/player';
import type Skill from '../../../entity/character/player/skill';

export default class Skills extends Menu {
    private list: HTMLUListElement = document.querySelector('#skills-list > ul')!;

    public constructor() {
        super('#skills-page');
    }

    /**
     * Synchronizes the player's skill data into the user interface.
     * @param player The player object used to grab skill data from.
     */

    public override synchronize(player: Player): void {
        this.list.innerHTML = '';

        _.each(player.skills, (skill: Skill) => this.list.append(this.createElement(skill)));
    }

    /**
     * Creates a new skill element that will be appended to the list.
     * @param skill Contains skill data to create the element with.
     */

    private createElement(skill: Skill): HTMLLIElement {
        let listElement = document.createElement('li'),
            skillElement = document.createElement('div'),
            name = document.createElement('div'),
            info = document.createElement('p');

        // Append the class to the elements.
        skillElement.classList.add('profession-item');
        name.classList.add('profession-name');

        // Update the skill element data.
        name.textContent = skill.name;
        info.textContent = `Level ${skill.level} | ${skill.percentage.toFixed(1)}%`;

        // Append children elements.
        name.append(info);
        skillElement.append(name);
        listElement.append(skillElement);

        return listElement;
    }
}
