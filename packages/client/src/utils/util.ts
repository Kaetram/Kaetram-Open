import { Modules, Opcodes } from '@kaetram/common/network';

export let isInt = (n: number): boolean => n % 1 === 0;

export default {
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
     * Converts an item's key into an image URL for the client.
     * It defaults to `null` if parameter is not specified.
     * @param key The item's key.
     * @returns The CSS image URL format for the item's key.
     */

    getImageURL(key = 'null'): string {
        return `url("/img/sprites/item-${key}.png")`;
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
        if (count > 999_999) return `${string.slice(0, Math.max(0, string.length - 6))}M`;

        // Convert numbers above 10,000 into kilo format (e.g. 25K)
        if (count > 9999) return `${string.slice(0, 2)}K`;

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
            case Modules.MenuActions.Use:
            case Modules.MenuActions.Equip:
            case Modules.MenuActions.Eat:
                return Opcodes.Container.Select;

            case Modules.MenuActions.Drop:
                return Opcodes.Container.Remove;

            case Modules.MenuActions.Move:
                return Opcodes.Container.Move;

            default:
                return -1;
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
    }
};
