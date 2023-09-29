import Menu from './menu';

import { Modules, Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type Task from '../entity/character/player/task';

export default class Quests extends Menu {
    public override identifier: number = Modules.Interfaces.Quests;

    // Contains the list of all the quests and their respective status.
    private list: HTMLUListElement = document.querySelector('#quests-list > ul')!;

    // The quest log element (used for scrolling actions).
    private questsLogsContainer: HTMLElement = document.querySelector('#quests-logs-container')!;

    // Contains information about a selected quest.
    private title: HTMLElement = document.querySelector('#quests-logs-title')!;
    private shortDescription: HTMLElement = document.querySelector('#quests-logs-shortdesc')!;
    private description: HTMLElement = document.querySelector('#quests-logs-description')!;
    private rewards: HTMLElement = document.querySelector('#quests-logs-rewards')!;
    private requirements: HTMLElement = document.querySelector('#quests-logs-requirements')!;

    public constructor(private player: Player) {
        super('#quests', '#close-quests', '#quests-button');
    }

    /**
     * Handles the incoming packets from the server and synchronizes the quest list.
     * @param opcode Type of action we are performing on the quest list.
     * @param key Optional parameter passed when a quest progresses.
     */

    public handle(opcode: Opcodes.Quest, key = ''): void {
        switch (opcode) {
            case Opcodes.Quest.Batch: {
                for (let quest of Object.values(this.player.quests)) this.createElement(quest);

                break;
            }

            case Opcodes.Quest.Progress: {
                return this.handleProgress(key);
            }
        }

        this.buildLog(this.player.quests.tutorial);
    }

    /**
     * Updates the progress of a quest.
     * @param key Used for identifying the quest.
     */

    private handleProgress(key: string): void {
        if (!key) return;

        let quest = this.player.quests[key];

        if (!quest) return;

        let element = this.list.children[quest.id],
            nameElement = element.querySelector('p')!;

        if (!nameElement) return;

        nameElement.classList.remove('text-green', 'text-yellow');

        // Update colours of the name relative to its completion
        if (quest.isFinished()) nameElement.classList.add('text-green');
        else if (quest.isStarted()) nameElement.classList.add('text-yellow');
    }

    /**
     * Creates a quest element and adds it to the list.
     * @param questName The name of the quest.
     */

    private createElement(quest: Task): void {
        let element = document.createElement('li'),
            name = document.createElement('p');

        // Add the slot class to the element.
        element.classList.add('slice-list-item');

        // Set the quest name.
        name.innerHTML = quest.name;

        // Update colours of the name relative to its completion
        if (quest.isFinished()) name.classList.add('text-green');
        else if (quest.isStarted()) name.classList.add('text-yellow');

        // Add the name element to the element.
        element.append(name);

        this.list.append(element);

        element.addEventListener('click', () => this.buildLog(quest));
    }

    /**
     * Uses the information from the quest to create the quest description.
     * @param quest The quest we are using to build the log.
     */

    private buildLog(quest: Task): void {
        this.questsLogsContainer.scrollTop = 0;

        let [shortDescription, description] = quest.description.split('|');

        this.title.innerHTML = quest.name;
        this.shortDescription.innerHTML = shortDescription;
        this.description.innerHTML = description;

        if (quest.rewards) this.rewards.innerHTML = quest.rewards.join('<br>');

        // No requirements to display, so we stop here.
        if (
            Object.keys(quest.skillRequirements).length === 0 &&
            quest.questRequirements.length === 0
        ) {
            this.requirements.innerHTML = 'None';
            return;
        }

        let requirements = '';

        // Iterate through the quest requirements and map the key to the quest name.
        for (let info of quest.questRequirements)
            requirements += `Completion of ${this.player.quests[info]?.name}.<br>`;

        // Iterate through the skill requirements and add them to the requirements string.
        for (let skill in quest.skillRequirements)
            requirements += `Your ${this.formatSkillName(skill)} level must be at least ${
                quest.skillRequirements[skill]
            }.<br>`;

        this.requirements.innerHTML = requirements;
    }

    /**
     * Formats the skill name for presentation in the quest log. We basically
     * captialize the first letter of the skill name.
     * @param key The key of the skill we are formatting.
     */

    private formatSkillName(key: string): string {
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
}
