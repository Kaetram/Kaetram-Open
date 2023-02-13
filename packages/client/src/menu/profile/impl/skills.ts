import Menu from '../../menu';

import { Modules } from '@kaetram/common/network';

import type Skill from '../../../entity/character/player/skill';
import type Player from '../../../entity/character/player/player';

interface SkillElement extends HTMLLIElement {
    name?: string;
    level?: number;
    percentage?: number;
    originalWidth?: number;
}

export default class Skills extends Menu {
    private list: HTMLUListElement = document.querySelector('#skills-list > ul')!;

    private loaded = false;

    public constructor(private player: Player) {
        super('#skills-page');
    }

    /**
     * Synchronizes the player's skill data into the user interface.
     * @param player The player object used to grab skill data from.
     */

    public override synchronize(): void {
        for (let skill of Object.values(this.player.skills)) {
            let element = this.get(skill.name);

            // Update the element if found.
            if (element) this.update(element, skill);
            else {
                // Create the element otherwise...
                element = this.createElement(skill);

                // Append the element to the list.
                this.list.append(element);

                // Update the element with the latest data.
                this.update(element, skill);
            }
        }
    }

    /**
     * Override for the show function. Due to the nature of the HTML DOM we must
     * re-synchronize data when we first show the page. This is because the skills
     * experience bar does not have a width until it is first shown on the page.
     * This function just checks if we have already loaded the page, if not, we
     * synchronize again since we just created the elements, the `synchronize` function
     * will grab the existing elements in the list and update their experience bar
     * widths accordingly.
     */

    public override show(): void {
        super.show();

        // Only synchronize upon first showing the page.
        if (this.loaded) return;

        this.loaded = true;

        this.synchronize();
    }

    /**
     * Creates a new skill element that will be appended to the list.
     * @param skill Contains skill data to create the element with.
     */

    private createElement(skill: Skill): HTMLLIElement {
        let element: SkillElement = document.createElement('li'),
            level = document.createElement('div'),
            image = document.createElement('div'),
            experience = document.createElement('div');

        // Add the skill class to the base element.
        element.classList.add('skill');

        // Update the skill level
        level.classList.add('skill-level', 'stroke');

        // Load the image based on the skill name.
        image.classList.add('skill-image', `skill-image-${skill.name.toLowerCase()}`);

        // Load up the experience bar.
        experience.classList.add('skill-experience');

        // Add the image to the element.
        element.append(level, experience, image);

        // Store information about the skill in the element.
        element.name = skill.name;
        element.level = skill.level;
        element.percentage = skill.percentage;

        return element;
    }

    /**
     * Finds an HTML skill element extension based on the name of the skill.
     * @param name The name of the skill we are looking for.
     * @returns A skill element extension if found, otherwise undefined.
     */

    private get(name: string): SkillElement | undefined {
        for (let element of this.list.children)
            if ((element as SkillElement).name === name) return element as SkillElement;

        return undefined;
    }

    /**
     * Updates a slot element with the latest level and percentage information.
     * @param element SkillElement HTML element that we are updating.
     * @param skill The skill we are using to update the data with.
     */

    private update(element: SkillElement, skill: Skill): void {
        // Update the level and experience bar of the skill.
        let level: HTMLElement = element.querySelector('.skill-level')!,
            experience: HTMLElement = element.querySelector('.skill-experience')!;

        // Update the skill level
        level.innerHTML = `${skill.level}/${Modules.Constants.MAX_LEVEL}`;

        //if (experience.offsetWidth === 0) return;

        // Store the original width of the experience bar.
        if (!element.originalWidth && experience.offsetWidth !== 0)
            element.originalWidth = experience.offsetWidth;

        if (!element.originalWidth) return;

        // Set the experience bar's width.
        experience.style.width = `${element.originalWidth * skill.percentage}px`;

        // Update the properties of the element.
        element.level = skill.level;
        element.percentage = skill.percentage;
    }
}
