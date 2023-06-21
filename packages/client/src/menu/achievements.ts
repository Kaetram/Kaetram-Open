import Menu from './menu';

import { Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type Task from '../entity/character/player/task';

export default class Achievements extends Menu {
    private tabArrowLeft: HTMLDivElement = document.querySelector('#achievements-tab-arrow-left')!;
    private tabArrowRight: HTMLDivElement = document.querySelector('#achievements-tab-arrow-right')!;

    private tabText: HTMLSpanElement = document.querySelector('#achievements-tab-text')!;

    // List where all the achievement objects are contained.
    private list: HTMLUListElement = document.querySelector('#achievements-content > ul')!;

    public constructor(private player: Player) {
        super('#achievements', '#close-achievements', '#achievements-button');

        this.tabArrowLeft.addEventListener('click', this.handleTabArrowLeft.bind(this));
        this.tabArrowRight.addEventListener('click', this.handleTabArrowRight.bind(this));
    }

    /**
     * We use the opcode from the achievement packet in order to determine what we are doing. If a batch
     * opcode is received then we create the list. Otherwise we extract the id of the achievement and update
     * it individually.
     */

    public handle(opcode: Opcodes.Achievement, key?: string): void {
        // Handle achievement batch creation.
        if (opcode === Opcodes.Achievement.Batch) {
            for (let key in this.player.achievements) this.createAchievement(this.player.achievements[key], key);

            return;
        }

        // Grab the task by key from the player. This will have been recently updated.
        let task = this.player.achievements[key!];

        // No task found.
        if (!task) return;

        // Secret tasks don't exist until they are discovered.
        if (task.secret) return this.createAchievement(task, key!);

        // Update the achievement element.
        this.update(this.list.children[task.id] as HTMLLIElement, task);
    }

    /**
     * Creates an achievement based on the task object provided. A task object is used
     * for either quests or achievements. In this case we are only using it for achievements.
     * @param task Contains information about the achievement we are creating.
     * @param key The key of the achievement we are creating.
     * @returns A list element containing the achievement information.
     */

    private createAchievement(task: Task, key: string): void {
        let element = document.createElement('li'),
            slot = document.createElement('div'),
            coin = document.createElement('div'),
            title = document.createElement('p'),
            description = document.createElement('p');

        // Adds the achievement element styling.
        element.classList.add('achievement-element', 'slice-list');

        // Adds the classes for the coin and achievement title.
        slot.classList.add('coin-slot');
        title.classList.add('achievement-title');

        // Adds the classes for achievement description.
        description.classList.add('achievement-description');

        /**
         * We add the achievement task information onto the title and description upon
         * creating the element. If the task is completed then the name and description
         * will display, otherwise question marks will appear.
         */

        title.innerHTML = task.name;
        description.innerHTML = task.description;

        // Add the coin to the slot.
        slot.append(coin);

        // Add the elements to the achievement element.
        element.append(slot, title, description);

        if (task.isFinished()) {
            // Title is displayed as gold if the achievement is completed.
            title.style.color = '#f4b41b';

            // Styling for the coin element.
            coin.classList.add(task.secret ? `coin-${key}` : 'coin-default');
        } else if (task.isStarted())
            // Create and add the progress to the achievement element.
            element.append(this.createProgress(task));

        this.list.append(element);
    }

    /**
     * Creates a progress text element in the bottom-right corner of the achievement element.
     * @param task Task we are using the base the progress off of.
     * @returns A paragraph element containing the progress information.
     */

    private createProgress(task: Task): HTMLElement {
        let progress = document.createElement('p');

        // Add styling to the progress.
        progress.classList.add('achievement-progress');

        // Hide the progress if task is not started and we are creating a progress object anyway.
        progress.innerHTML = task.isStarted() ? `${task.stage - 1}/${task.stageCount - 1}` : '';

        return progress;
    }

    /**
     * Updates a specified element with the task information provided.
     * @param element Element we are updating.
     * @param task Task information we are using to update the element.
     */

    private update(element: HTMLLIElement, task: Task): void {
        let title = element.querySelector<HTMLElement>('.achievement-title')!,
            description = element.querySelector<HTMLElement>('.achievement-description')!,
            progress = element.querySelector<HTMLElement>('.achievement-progress')!;

        /**
         * Synchronize the information from the task with that
         * of the achievement element.
         */

        title.innerHTML = task.name;
        description.innerHTML = task.description;

        if (task.isFinished()) {
            // Title is displayed as gold if the achievement is completed.
            title.style.color = '#fcda1d';

            // Remove the progression element.
            progress?.remove();

            // Styling for the coin element.
            let coin = document.createElement('div');

            coin.classList.add('coin');
            coin.classList.add('coin-default');

            // Add the coin element to the beginning of the children list.
            element.prepend(coin);
        } else {
            // Title is displayed as white if the achievement is not completed.
            title.style.color = '#fff';

            // Remove the coin element.
            let coin = element.querySelector('.coin')!;

            coin?.remove();

            // No progress element found.
            if (progress) progress.innerHTML = task.isStarted() ? `${task.stage - 1}/${task.stageCount - 1}` : '';
            else {
                progress = this.createProgress(task);
                element.append(progress);
            }
        }
    }

    /**
     * Handles the tab arrow left click event.
     */

    private handleTabArrowLeft(): void {
        console.log('left');
    }

    /**
     * Handles the tab arrow right click event.
     */

    private handleTabArrowRight(): void {
        console.log('right');
    }
}
