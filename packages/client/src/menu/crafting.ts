import Menu from './menu';

import Utils from '../utils/util';

import { Opcodes } from '@kaetram/common/network';

import type Game from '../game';
import type { CraftingRequirement } from '@kaetram/common/types/crafting';
import type { CraftingPacket } from '@kaetram/common/types/messages/outgoing';

type SelectCallback = (key: string) => void;
type CraftCallback = (key: string, amount: number) => void;
export default class Crafting extends Menu {
    // Where we store the available options for crafting.
    private options: HTMLUListElement = document.querySelector('#crafting-options')!;
    private requirements: HTMLUListElement = document.querySelector('#crafting-requirements')!;

    private result: HTMLDivElement = document.querySelector('#crafting-result')!;

    // Amount buttons.
    private craftOne: HTMLDivElement = document.querySelector('#craft-one')!;
    private craftFive: HTMLDivElement = document.querySelector('#craft-five')!;
    private craftTen: HTMLDivElement = document.querySelector('#craft-ten')!;

    // Confirm button
    private craftButton: HTMLDivElement = document.querySelector('#craft-button')!;

    // Crafting amount for sending to the server.
    private selectedKey = '';
    private craftAmount = 1;

    // Callbacks for when the player selects an option.
    private selectCallback?: SelectCallback;
    private craftCallback?: CraftCallback;

    public constructor(private game: Game) {
        super('#crafting', '#close-crafting');

        this.craftOne.addEventListener('click', () => this.handleAmount(1));
        this.craftFive.addEventListener('click', () => this.handleAmount(5));
        this.craftTen.addEventListener('click', () => this.handleAmount(10));

        this.craftButton.addEventListener('click', () =>
            this.craftCallback?.(this.selectedKey, this.craftAmount)
        );
    }

    /**
     * Handles receiving information about crafting. This is used to synchronize the crafting
     * user interface with the server. When a player selects an item to craft this
     * @param opcode Contains the type of crafting action that we want to perform.
     * @param info Contains the information about the crafting action.
     */

    public handle(opcode: Opcodes.Crafting, info: CraftingPacket): void {
        switch (opcode) {
            case Opcodes.Crafting.Open: {
                return this.show(info.keys!);
            }

            case Opcodes.Crafting.Select: {
                return this.handleSelect(info.key!, info.result!, info.requirements!);
            }
        }
    }

    /**
     * Handles displaying the requirements and result for the item that the player selected.
     * @param key The key of the item that the player selected.
     * @param count The amount of the item selected we will receive as a result.
     * @param requirements The requirements for the item that the player selected.
     */

    private handleSelect(key: string, count: number, requirements: CraftingRequirement[]): void {
        // Clear the requirements and result.
        this.requirements.innerHTML = '';

        // Update the selected key.
        this.selectedKey = key;

        // Set the result image.
        let icon: HTMLDivElement = this.result.querySelector('.crafting-option-icon')!;

        icon.style.backgroundImage = Utils.getImageURL(key);

        if (count > 1) {
            let countElement: HTMLDivElement = this.result.querySelector('.crafting-option-count')!;

            countElement.innerHTML = `x${count}`;
        }

        // Create new requirement element and append it to the list of requirements.
        for (let requirement of requirements)
            this.requirements.append(this.createSlot(requirement.key, requirement.count));
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

    public override show(keys: string[]): void {
        super.show();

        // Clear all the options.
        this.options.innerHTML = '';

        // Create a new option for each key and append it to the list of options.
        for (let key of keys) this.options.append(this.createSlot(key));

        // Select the first option by default if it exists.
        if (keys.length > 0) this.selectCallback?.(keys[0]);
    }

    /**
     * Creates a option list element and appends it to the list of options.
     * @param key The key of the item to craft.
     */

    private createSlot(key: string, count?: number): HTMLLIElement {
        let element = document.createElement('li'),
            icon = document.createElement('div');

        // Apply the classes to the elements
        element.classList.add('crafting-option');
        icon.classList.add('crafting-option-icon');

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
        element.addEventListener('click', () => this.selectCallback?.(key));

        return element;
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
