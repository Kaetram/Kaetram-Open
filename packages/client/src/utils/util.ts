import { onSecondaryPress } from './press';

import { Modules, Opcodes } from '@kaetram/common/network';

import type { Bonuses, Stats } from '@kaetram/common/types/item';

export let isInt = (n: number): boolean => n % 1 === 0;

export default {
    tileSize: -1,
    sideLength: -1,
    thirdTile: -1,
    tileAndAQuarter: -1,

    /**
     * Creates a unique ID for a given time.
     * @param time The time in milliseconds.
     * @param x Optional parameter to concatenate to the ID.
     * @param y Optional parameter to concatenate to the ID.
     * @returns A concatenated string of the time and optional parameters.
     */

    createId(time: number, x = 0, y = 0): string {
        return `${time}${x}${y}`;
    },

    /**
     * Generates a random integer number using Math library.
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @returns Random integer between min and max.
     */

    randomInt(min: number, max: number): number {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    /**
     * Creates a new slot element based using the bank-slot class. This creates
     * an empty skeleton that we can then place items in. A callback event listener
     * is also created alongside the slot. Whenever a slot is pressed, its type
     * and index are parameters that are passed to the callback.
     * @param type The type of slot we are creating (used for callback as well).
     * @param index Index of the slot we are creating (for identification).
     * @param primaryCallback The callback function for the primary pressed.
     * @param secondaryCallback The callback function for the secondary pressed.
     */

    createSlot(
        type: Modules.ContainerType,
        index: number,
        primaryCallback?: (type: Modules.ContainerType, index: number) => void,
        secondaryCallback?: (type: Modules.ContainerType, index: number) => void
    ): HTMLLIElement {
        let listElement = document.createElement('li'),
            slot = document.createElement('div'),
            image = document.createElement('div'),
            count = document.createElement('div');

        slot.dataset.type = `${type}`;
        slot.dataset.index = `${index}`;

        // Sets the class of the bank slot.
        slot.classList.add('item-slot');

        // Sets the class of the image.
        image.classList.add('item-image');

        // Sets the class of the count.
        count.classList.add('item-count');

        // Bank item counts are a different colour.
        if (type === Modules.ContainerType.Bank) count.classList.add('bank-item-count');

        // Appends image and count onto the bank slot.
        slot.append(image);
        slot.append(count);

        if (primaryCallback) slot.addEventListener('click', () => primaryCallback(type, index));
        if (secondaryCallback) onSecondaryPress(slot, () => secondaryCallback(type, index));

        // Appends the bank slot onto the list element.
        listElement.append(slot);

        return listElement;
    },

    /**
     * Converts an item's key into an image URL for the client.
     * @param key The item's key, defaults to empty string.
     * @returns The CSS image URL format for the item's key.
     */

    getImageURL(key = ''): string {
        if (key === '') return '';

        return `url("/img/sprites/item-${key}.png")`;
    },

    /**
     * Takes any name (or string as a matter of fact) and capitalizes
     * every first letter after a space.
     * Example: 'tHiS Is a usErName' -> 'This Is A Username'
     * @param name The raw username string defaulting to '' if not specified.
     * @returns The formatted name string.
     */

    formatName(name = ''): string {
        return name.replace(
            /\w\S*/g,
            (string) => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
        );
    },

    /**
     * Converts an integer value into a compact string used
     * when wanting to display large numbers of stackable items.
     * For example, 15000 coins get displayed as 15K and
     * 1200400 coins displayed as 1.2M
     */

    getCount(count: number): string {
        // Convert count to string.
        let string = count.toString();

        // Converts numbers 1 million and above to short-hand format (e.g. 25M)
        if (count > 999_999) return `${Math.floor(count / 1_000_000)}M`;

        // Convert numbers above 10,000 into kilo format (e.g. 25K)
        if (count > 9999) return `${Math.floor(count / 1000)}K`;

        // Any number above 1 is displayed as a string.
        if (count > 1) return string;

        // Do not display counts of 1.
        return '';
    },

    /**
     * Converts a menu action into a container opcode action.
     * @param menuAction Menu action that we are converting.
     */

    getContainerAction(menuAction: Modules.MenuActions): Opcodes.Container {
        switch (menuAction) {
            case Modules.MenuActions.Wield:
            case Modules.MenuActions.Equip:
            case Modules.MenuActions.Eat:
            case Modules.MenuActions.Eat2: {
                return Opcodes.Container.Select;
            }

            case Modules.MenuActions.DropOne: {
                return Opcodes.Container.Remove;
            }

            case Modules.MenuActions.Move: {
                return Opcodes.Container.Swap;
            }

            default: {
                return -1;
            }
        }
    },

    /**
     * Checks the email string against regular expression.
     * @param email Email string to verify.
     * @returns Whether or not the email string follows the proper Regex pattern.
     */

    isEmail(email: string): boolean {
        return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(
            email
        );
    },

    /**
     * Calculates the region based on provided coordinates.
     * @param x The x grid coordinate.
     * @param y The y grid coordinate.
     * @returns The region number.
     */

    getRegion(x: number, y: number): number {
        let regX = Math.floor(x / Modules.Constants.MAP_DIVISION_SIZE),
            regY = Math.floor(y / Modules.Constants.MAP_DIVISION_SIZE);

        return regX + regY * this.sideLength;
    },

    /**
     * For the purpose of not repeatedly writing the same stats.
     * @returns Empty stats values.
     */

    getEmptyStats(): Stats {
        return {
            crush: 0,
            slash: 0,
            stab: 0,
            archery: 0,
            magic: 0
        };
    },

    /**
     * Creates an empty bonuses object.
     * @returns Empty bonuses object with default values.
     */

    getEmptyBonuses(): Bonuses {
        return {
            accuracy: 0,
            strength: 0,
            archery: 0,
            magic: 0
        };
    },

    /**
     * Fades in an element.
     * @param element The element to fade in.
     * @param speed (Optional) The speed at which to fade in.
     */

    fadeIn(element: HTMLElement, speed = 0.1): void {
        element.style.opacity ||= '0';
        element.style.display = 'block';

        let fade = () => {
            let opacity = parseFloat(element.style.opacity) + speed;

            if (opacity <= 1) {
                element.style.opacity = opacity.toString();
                requestAnimationFrame(fade);
            }
        };

        requestAnimationFrame(fade);
    },

    /**
     * Fades out an element.
     * @param element The element to fade out.
     * @param speed (Optional) The speed at which to fade out.
     */

    fadeOut(element: HTMLElement, speed = 0.2): void {
        element.style.opacity ||= '1';

        let fade = () => {
            let opacity = parseFloat(element.style.opacity) - speed;

            if (opacity >= 0) {
                element.style.opacity = opacity.toString();
                requestAnimationFrame(fade);
            } else element.style.display = 'none';
        };

        requestAnimationFrame(fade);
    }
};
