import Menu from '../../menu';
import Util from '../../../utils/util';

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

    // Skill info side-menu
    private info: HTMLElement = document.querySelector('#skill-info')!;

    // Skill we have info menu open for.
    private selectedSkill!: Skill;

    private loaded = false;

    public constructor(private player: Player) {
        super('#skills-page');
    }

    /**
     * Synchronizes the player's skill data into the user interface.
     * @param resize Whether we need to re-calculate the experience bar widths.
     */

    public override synchronize(resize = false): void {
        if (Object.keys(this.player.skills).length === 0) return;

        if (resize) this.list.innerHTML = '';

        for (let id of Modules.SkillsOrder) {
            let skill = this.player.skills[id];

            if (!skill) continue;

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

        if (this.isInfoVisible()) this.showInfo();
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
     * Override for the superclass `hide` function to also hide
     * the profile info side-menu.
     */

    public override hide(): void {
        super.hide();

        this.hideInfo();
    }

    /**
     * Hides the info side-menu.
     */

    public hideInfo(): void {
        Util.fadeOut(this.info);
    }

    /**
     * Creates a new skill element that will be appended to the list.
     * @param skill Contains skill data to create the element with.
     */

    private createElement(skill: Skill): HTMLLIElement {
        let element: SkillElement = document.createElement('li'),
            slot = document.createElement('div'),
            image = document.createElement('div'),
            content = document.createElement('div'),
            level = document.createElement('div'),
            experience = document.createElement('div'),
            expProgress = document.createElement('div');

        // Add the skill class to the base element.
        element.classList.add('slice-list-item');

        // Add the item slot slice to the element.
        slot.classList.add('slice-item-slot');

        // Load the image based on the skill name.
        image.classList.add('skill-image', `skill-image-${skill.name.toLowerCase()}`);

        // Load up the content.
        content.classList.add('skill-content');

        // Update the skill level
        level.classList.add('skill-level', 'stroke');

        // Update the experience bar container.
        experience.classList.add('skill-experience');

        // Load up the experience bar.
        expProgress.classList.add('skill-experience-progress');

        // Add the image to the item slot.
        slot.append(image);

        // Add the experience bar to the experience container.
        experience.append(expProgress);

        // Add the level and experience bar to the content.
        content.append(level, experience);

        // Add the slot and content to the element.
        element.append(slot, content);

        // Store information about the skill in the element.
        element.name = skill.name;
        element.level = skill.level;
        element.percentage = skill.percentage;

        // Add the click event to the element.
        element.addEventListener('click', () => this.showInfo(skill));

        return element;
    }

    /**
     * When we click on a skill we want to show some more information.
     * @param skill The skill that we are showing information for.
     */

    private showInfo(skill = this.selectedSkill): void {
        Util.fadeIn(this.info);

        let image = this.info.querySelector('.skill-info-image')!,
            title = this.info.querySelector('.skill-info-title')!,
            details = this.info.querySelector('.skill-info-details')!;

        // Update the image and title of the skill.
        image.className = `skill-info-image skill-image-${skill.name.toLowerCase()}`;
        title.innerHTML = skill.name;

        // Update the details of the skill.
        details.innerHTML = `
            <span><strong>Level:</strong> ${skill.level}</span>
            <span><strong>Exp:</strong> ${skill.experience}</span>
            <span><strong>Next Exp:</strong> ${skill.nextExperience}</span>
            <span><strong>Percent:</strong> ${(skill.percentage * 100).toFixed(3)}%</span>
        `;

        this.selectedSkill = skill;
    }

    /**
     * Updates a slot element with the latest level and percentage information.
     * @param element SkillElement HTML element that we are updating.
     * @param skill The skill we are using to update the data with.
     */

    private update(element: SkillElement, skill: Skill): void {
        // Update the level and experience bar of the skill.
        let level: HTMLElement = element.querySelector('.skill-level')!,
            expProgress: HTMLElement = element.querySelector('.skill-experience-progress')!;

        // Update the skill level
        level.innerHTML = `${skill.level}/${Modules.Constants.MAX_LEVEL}`;

        // Set the experience bar's width.
        expProgress.style.width = `${skill.percentage * 100}%`;

        // Update the properties of the element.
        element.level = skill.level;
        element.percentage = skill.percentage;
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
     * @returns Whether or not the profile info side-menu is visible.
     */

    public isInfoVisible(): boolean {
        return this.info.style.display === 'flex';
    }
}
