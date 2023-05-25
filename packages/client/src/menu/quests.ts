import Menu from './menu';

import { Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type Task from '../entity/character/player/task';

export default class Quests extends Menu {
    // Contains the list of all the quests and their respective status.
    private list: HTMLUListElement = document.querySelector('#quests-container > ul')!;

    // Contains information about a selected quest.
    private title: HTMLElement = document.querySelector('#quest-log-title')!;
    private shortDescription: HTMLElement = document.querySelector('#quest-log-shortdesc')!;
    private description: HTMLElement = document.querySelector('#quest-log-description')!;
    private rewards: HTMLElement = document.querySelector('#quest-log-rewards')!;

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

        nameElement.classList.remove('green', 'yellow');

        // Update colours of the name relative to its completion
        if (quest.isFinished()) nameElement.classList.add('green');
        else if (quest.isStarted()) nameElement.classList.add('yellow');
    }

    /**
     * Creates a quest element and adds it to the list.
     * @param questName The name of the quest.
     */

    private createElement(quest: Task): void {
        let element = document.createElement('li'),
            name = document.createElement('p');

        // Add the slot class to the element.
        element.classList.add('container-slot');

        // Add styling to the friend name element.
        name.classList.add('stroke');

        // Set the quest name.
        name.innerHTML = quest.name;

        // Update colours of the name relative to its completion
        if (quest.isFinished()) name.classList.add('green');
        else if (quest.isStarted()) name.classList.add('yellow');

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
        let [shortDescription, description] = quest.description.split('|');

        this.title.innerHTML = quest.name;
        this.shortDescription.innerHTML = shortDescription;
        this.description.innerHTML = description;

        if (quest.rewards) this.rewards.innerHTML = quest.rewards.join('<br>');
    }
}
