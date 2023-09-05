import Menu from './menu';

import Utils from '../utils/util';

import { Modules, Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type {
    CraftingItemPreview,
    CraftingRequirement
} from '@kaetram/common/network/impl/crafting';
import type { CraftingPacketData } from '@kaetram/common/types/messages/outgoing';

type SelectCallback = (key: string) => void;
type CraftCallback = (key: string, amount: number) => void;
export default class Crafting extends Menu {
    public override identifier: number = Modules.Interfaces.Crafting;

    // Where we store the available options for crafting.
    private options: HTMLUListElement = document.querySelector('#crafting-options')!;
    private requirements: HTMLUListElement = document.querySelector('#crafting-requirements')!;

    // Result section
    private result: HTMLDivElement = document.querySelector('#crafting-result')!;
    private level: HTMLDivElement = document.querySelector('#crafting-level')!;
    private name: HTMLDivElement = document.querySelector('#crafting-result-name')!;

    // Amount buttons.
    private craftOne: HTMLDivElement = document.querySelector('#craft-one')!;
    private craftFive: HTMLDivElement = document.querySelector('#craft-five')!;
    private craftTen: HTMLDivElement = document.querySelector('#craft-ten')!;

    // Confirm button
    private craftButton: HTMLDivElement = document.querySelector('#craft-button')!;

    // Crafting amount for sending to the server.
    private selectedKey = '';
    private craftAmount = 1;

    // Data for the currently selected crafting elements.
    private type: Modules.Skills = Modules.Skills.Crafting;

    // Callbacks for when the player selects an option.
    private selectCallback?: SelectCallback;
    private craftCallback?: CraftCallback;

    public constructor(private player: Player) {
        super('#crafting', '#close-crafting');

        this.craftOne.addEventListener('click', () => this.handleAmount(1));
        this.craftFive.addEventListener('click', () => this.handleAmount(5));
        this.craftTen.addEventListener('click', () => this.handleAmount(10));

        this.craftButton.addEventListener('click', () => {
            this.craftCallback?.(this.selectedKey, this.craftAmount);
            this.hide();
        });
    }

    /**
     * Handles receiving information about crafting. This is used to synchronize the crafting
     * user interface with the server. When a player selects an item to craft this
     * @param opcode Contains the type of crafting action that we want to perform.
     * @param info Contains the information about the crafting action.
     */

    public handle(opcode: Opcodes.Crafting, info: CraftingPacketData): void {
        switch (opcode) {
            case Opcodes.Crafting.Open: {
                return this.show(info.type!, info.previews!);
            }

            case Opcodes.Crafting.Select: {
                return this.handleSelect(
                    info.key!,
                    info.name!,
                    info.level!,
                    info.result!,
                    info.requirements!
                );
            }
        }
    }

    /**
     * Handles displaying the requirements and result for the item that the player selected.
     * @param key The key of the item that the player selected.
     * @param name The formatted name of the item (the one the player sees).
     * @param level The level required to craft the item.
     * @param count The amount of the item selected we will receive as a result.
     * @param requirements The requirements for the item that the player selected.
     */

    private handleSelect(
        key: string,
        name: string,
        level: number,
        count: number,
        requirements: CraftingRequirement[]
    ): void {
        // Clear the requirements and result.
        this.requirements.innerHTML = '';

        // Update the selected key.
        this.selectedKey = key;

        // Set the result image.
        let icon: HTMLElement = this.result.querySelector('.crafting-option-icon')!,
            countElement: HTMLElement = this.result.querySelector('.crafting-option-count')!,
            levelIcon: HTMLElement = this.level.querySelector('.crafting-option-icon')!,
            levelCount = this.level.querySelector('.crafting-option-count')!;

        // Update the result icons.
        icon.style.backgroundImage = Utils.getImageURL(key);
        levelIcon.style.backgroundImage = this.getSkillIcon();

        // Set the amount of the item that we will receive as a result.
        countElement.innerHTML = `x${count}`;

        // Set the level required to craft the item.
        levelCount.innerHTML = `${level}`;

        // Update the name of the item.
        this.name.innerHTML = name;

        // Create new requirement element and append it to the list of requirements.
        for (let requirement of requirements)
            this.requirements.append(
                this.createSlot(requirement.key, requirement.name!, requirement.count, 0, true)
            );
    }

    /**
     * Handles when we click the craft amount buttons. Handles toggling the active classes
     * and updating how many items we want to craft.
     * @param amount The amount of items selected.
     */

    private handleAmount(amount: number): void {
        this.craftAmount = amount;

        this.craftOne.classList.remove('active');
        this.craftFive.classList.remove('active');
        this.craftTen.classList.remove('active');

        switch (amount) {
            case 1: {
                this.craftOne.classList.add('active');
                break;
            }

            case 5: {
                this.craftFive.classList.add('active');
                break;
            }

            case 10: {
                this.craftTen.classList.add('active');
                break;
            }
        }
    }

    /**
     * Loads the keys in the options list. This is used to display the available items
     * that the player can craft.
     * @param keys Contains a string array of the available keys (used for item url path).
     */

    public override show(type: Modules.Skills, previews: CraftingItemPreview[]): void {
        super.show();

        // Clear all the options.
        this.options.innerHTML = '';

        // Update the crafting type
        this.type = type;

        // Create a new option for each key and append it to the list of options.
        for (let preview of previews)
            this.options.append(this.createSlot(preview.key, '', 0, preview.level));

        // Select the first option by default if it exists.
        if (previews.length > 0) {
            this.selectCallback?.(previews[0].key);

            this.options.children[0].classList.add('active');
        }

        // Update the craft button text according to the type of interface.
        let text = 'Craft';

        switch (type) {
            case Modules.Skills.Cooking: {
                text = 'Cook';
                break;
            }

            case Modules.Skills.Chiseling:
            case Modules.Skills.Crafting: {
                text = 'Craft';
                break;
            }

            case Modules.Skills.Fletching: {
                text = 'Fletch';
                break;
            }

            case Modules.Skills.Smithing: {
                text = 'Smith';
                break;
            }

            case Modules.Skills.Smelting: {
                text = 'Smelt';
                break;
            }

            case Modules.Skills.Alchemy: {
                text = 'Brew';
                break;
            }
        }

        this.craftButton.innerHTML = text;
    }

    /**
     * Creates a option list element and appends it to the list of options.
     * @param key The key of the item to craft.
     * @param name The formatted name of the item to craft.
     * @param count The amount of the item to craft.
     * @param disableClick Whether or not to disable the click event for the option.
     */

    private createSlot(
        key: string,
        name?: string,
        count?: number,
        level = 0,
        disableClick = false
    ): HTMLLIElement {
        let element = document.createElement('li'),
            icon = document.createElement('div');

        // Apply the classes to the elements
        element.classList.add('crafting-option');
        icon.classList.add('crafting-option-icon');

        // Fade and greyscale the icon if the player doesn't have the required level.
        if (this.player.skills[this.type]?.level < level) icon.classList.add('greyscale');

        // Apply the image url to the icon.
        icon.style.backgroundImage = Utils.getImageURL(key);

        // Append the icon to the option element.
        element.append(icon);

        // Create the count element and apply it if it's provided
        if (count) {
            let countElement = document.createElement('div');

            countElement.classList.add('crafting-option-count', 'stroke');
            countElement.innerHTML = `x${count}`;

            element.append(countElement);
        }

        // Bind the click event to the select callback so that it can be sent to the server.
        if (disableClick) element.classList.add('disabled');
        else
            element.addEventListener('click', () => {
                // Remove the active class from all the options.
                for (let child of this.options.children) child.classList.remove('active');

                // Add the active class to the selected option.
                element.classList.add('active');

                this.selectCallback?.(key);
            });

        return element;
    }

    /**
     * Grabs the skill icon for the currently open interface. We use
     * this function to handle special cases of crafting interfaces that
     * share the same skill.
     */

    private getSkillIcon(): string {
        let name = Modules.Skills[this.type].toLowerCase();

        return `url(/img/interface/skills/${name}.png)`;
    }

    /**
     * Handles clicking on a crafting option. Sends a request to the server to
     * obtain information about the item that the player wishes to craft.
     * @param callback Contains the key of the item to craft.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }

    /**
     * Handles sending a packet to the server that we want to craft.
     * @param callback Contains the key and amount we want to craft.
     */

    public onCraft(callback: CraftCallback): void {
        this.craftCallback = callback;
    }
}
