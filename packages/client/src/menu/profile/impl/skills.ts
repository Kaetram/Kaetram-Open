import Menu from '../../menu';

import _ from 'lodash-es';
import { Modules } from '@kaetram/common/network';

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
        let element = document.createElement('li'),
            name = document.createElement('div'),
            image = document.createElement('div'),
            experience = document.createElement('div');

        // Add the skill class to the base element.
        element.classList.add('skill');

        // Update the skill level
        name.classList.add('skill-level', 'stroke');
        name.innerHTML = `${skill.level}/${Modules.Constants.MAX_LEVEL}`;

        // Load the image based on the skill name.
        image.classList.add('skill-image', `skill-image-${skill.name.toLowerCase()}`);

        // Load up the experience bar.
        experience.classList.add('skill-experience');

        // Set the experience bar's width.
        experience.style.width = `${experience.offsetWidth * skill.percentage}px`;

        // Add the image to the element.
        element.append(name, experience, image);

        return element;
    }
}
