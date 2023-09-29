import { onSecondaryPress } from './press';

import Sprite from '../entity/sprite';

import { t } from '@kaetram/common/i18n';
import { Modules, Opcodes } from '@kaetram/common/network';

import type { AnimationData } from '../entity/sprite';
import type { Bonuses, Stats } from '@kaetram/common/types/item';

export let isInt = (n: number): boolean => n % 1 === 0;

export default {
    tileSize: -1,
    sideLength: -1,
    halfTile: -1,
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
        return min + ~~(Math.random() * (max - min + 1));
    },

    /**
     * Calculates the Pythagorean distance between two points. Yes this is one
     * of the few times that high-school math is useful, so it wasn't all for
     * nothing.
     * @param fromX The starting x coordinate.
     * @param fromY The starting y coordinate.
     * @param toX The ending x coordinate.
     * @param toY The ending y coordinate.
     * @returns The distance between the two points in floating point.
     */

    distance(fromX: number, fromY: number, toX: number, toY: number): number {
        return Math.sqrt(Math.pow(fromX - toX, 2) + Math.pow(fromY - toY, 2));
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

        // Appends the image to the slot.
        slot.append(image);

        if (primaryCallback) slot.addEventListener('click', () => primaryCallback(type, index));
        if (secondaryCallback) onSecondaryPress(slot, () => secondaryCallback(type, index));

        // Appends the slot and count to the list element.
        listElement.append(slot, count);

        return listElement;
    },

    /**
     * Converts an item's key into an image URL for the client.
     * @param itemKey The item's key, defaults to empty string.
     * @returns The CSS image URL format for the item's key.
     */

    getImageURL(itemKey = ''): string {
        if (!itemKey) return '';

        let blocks = itemKey.split('/');

        // Use the last block as the key if we are extracting a key path.
        if (blocks.length > 1) itemKey = blocks.at(-1)!;

        return `url("/img/sprites/items/${itemKey}.png")`;
    },

    /**
     * Grabs the placeholder icon for when the equipment slow is unequipped.
     * @param type The type of equipment we are getting the icon for.
     * @returns A string of the URL for the icon.
     */

    getEquipmentPlaceholderURL(type: Modules.Equipment): string {
        let equipment = Modules.Equipment[type].toLowerCase();

        return `url("img/interface/equipment/${equipment}.png")`;
    },

    /**
     * Takes any name (or string as a matter of fact) and capitalizes
     * every first letter after a space.
     * Example: 'tHiS Is a usErName' -> 'This Is A Username'
     * @param name The raw username string defaulting to '' if not specified.
     * @param trim The amount of characters to trim the name to.
     * @returns The formatted name string.
     */

    formatName(name = '', trim = 0): string {
        name = name.replace(
            /\w\S*/g,
            (string) => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
        );

        // Trim the name if specified.
        if (trim > 1 && name.length > trim) name = `${name.slice(0, Math.max(0, trim))}...`;

        return name;
    },

    /**
     * Responsible for handling the formatting of a string when received from a server. If this
     * string is an i18n string, then we must handle the data passed alongside with it and extract
     * it into the necessary format.
     * @param message The message string that we are formatting.
     */

    formatNotification(message: string): string {
        // Raw notification text, no need to format.
        if (!message.includes(':')) return message;

        // If there is no ; character to indicate variables then we return the i18n parsed string;
        if (!message.includes(';')) return t(message as never);

        /**
         * Split the message string into blocks, the first block is the actual i18n string to call
         * and each subsequent block is a variable to pass to the i18n string.
         */

        let blocks = message.split(';'),
            data: { [key: string]: string } = {};

        // Iterate through the variable blocks.
        for (let i = 1; i < blocks.length; i++) {
            let [key, value] = blocks[i].split('=');

            // Insert the key and value into the data object.
            data[key] = value;
        }

        return t(blocks[0] as never, data as never);
    },

    /**
     * Responsible for extracting special characters responsible for colour codes
     * from the message string and converting them into HTML span elements.
     * @param message The message string that we are parsing.
     */

    parseMessage(message: string): string {
        try {
            let messageBlocks = message.split('@');

            if (messageBlocks.length % 2 === 0) return messageBlocks.join(' ');

            for (let index in messageBlocks)
                if (parseInt(index) % 2 !== 0)
                    // we hit a colour code.
                    messageBlocks[index] = `<span style="color:${messageBlocks[index]};">`;

            let codeCount = messageBlocks.length / 2 - 1;

            for (let i = 0; i < codeCount; i++) messageBlocks.push('</span>');

            return messageBlocks.join('');
        } catch {
            return '';
        }
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

    getContainerAction(menuAction: Modules.MenuActions): Opcodes.Container | undefined {
        switch (menuAction) {
            case Modules.MenuActions.Interact:
            case Modules.MenuActions.Equip:
            case Modules.MenuActions.Eat:
            case Modules.MenuActions.Potion: {
                return Opcodes.Container.Select;
            }

            case Modules.MenuActions.DropOne: {
                return Opcodes.Container.Remove;
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
     * Given the input of a sprite, we generate a hurt sprite. A hurt sprite
     * is one that has all non-empty pixels turned a shade of red. We assume that
     * the sprite is loaded upon calling this function. The hurt sprite is
     * identical and can be a clone of the original sprite.
     * @param sprite The sprite that we want to generate a hurt sprite for.
     */

    getHurtSprite(sprite: Sprite): Sprite {
        let canvas = document.createElement('canvas'),
            context = canvas.getContext('2d', { willReadFrequently: true })!,
            hurtSprite = new Sprite(sprite.data); // Create a clone to avoid issues.

        canvas.width = sprite.image.width;
        canvas.height = sprite.image.height;

        // Draw an image of the sprite onto the canvas.
        context.drawImage(sprite.image, 0, 0, sprite.image.width, sprite.image.height);

        let spriteData = context.getImageData(0, 0, sprite.image.width, sprite.image.height);

        /**
         * This function iterates through the pixel data. The context data stores pixel information
         * in a 1D array. Each value represents a colour channel (red, green, blue, alpha). At each
         * 4 indices, information about a single pixel is stored. For example, the first 4 indices
         * represent the red, green, blue and alpha values of the first pixel. The next 4 indices
         * represent the red, green, blue and alpha values of the second pixel and so on.
         */

        for (let i = 0; i < spriteData.data.length; i += 4) {
            // Skip transparent pixels.
            if (spriteData.data[i + 4] === 0) continue;

            // 0 - red, 1 - green, 2 - blue, 3 - alpha
            spriteData.data[i] = 255;
            spriteData.data[i + 1] = spriteData.data[i + 2] = 75;
        }

        // Apply the new image data onto the context
        context.putImageData(spriteData, 0, 0);

        // Update the image of the hurt sprite.
        hurtSprite.image = canvas;

        // Toggle as loaded for use
        hurtSprite.loaded = true;

        return hurtSprite;
    },

    /**
     * A silhouette is a yellow hue that is drawn around the sprite. It is used for
     * highlighting a sprite when hovering over it.
     */

    getSilhouetteSprite(sprite: Sprite): Sprite {
        let canvas = document.createElement('canvas'),
            context = canvas.getContext('2d', { willReadFrequently: true })!,
            silhouetteSprite = new Sprite(sprite.data); // Create a clone to avoid issues.

        canvas.width = sprite.image.width;
        canvas.height = sprite.image.height;

        // Draw an image of the sprite onto the canvas.
        context.drawImage(sprite.image, 0, 0, sprite.image.width, sprite.image.height);

        let spriteData = context.getImageData(0, 0, sprite.image.width, sprite.image.height),
            cloneData = context.getImageData(0, 0, sprite.image.width, sprite.image.height);

        /**
         * We iterate each pixel (4 indices) and look for a pixel that has a zero alpha value
         * but also has an adjacent pixel that has a non-zero alpha value. If this is the case,
         * we set the pixel colour to (255, 255, 150) and alpha to 150.
         */

        for (let i = 0; i < cloneData.data.length; i += 4) {
            // Non-empty pixels are skipped.
            if (cloneData.data[i + 3] > 24) continue;

            // Ignore the delimiter pixels (RGBA: x, x, x, 1);
            if (cloneData.data[i + 3] === 1) continue;

            // Extract the x and y coordinates of the pixel.
            let x = (i / 4) % sprite.image.width,
                y = ~~(i / 4 / sprite.image.width);

            // Test edge cases, we don't want to draw a silhouette on the edge of the sprite.
            if (x === 0 || x === sprite.image.width - 1 || y === 0 || y === sprite.image.height - 1)
                continue;

            // Verify the up, down, left and right pixels.
            let adjacentPixels = [
                cloneData.data[i - 1], // Left
                cloneData.data[i + 7], // Right
                cloneData.data[i - cloneData.width * 4 + 3], // Up
                cloneData.data[i + cloneData.width * 4 + 3] // Down
            ];

            // If any of the adjacent pixels are non-empty, we set the current pixel to yellow.
            if (adjacentPixels.some((pixel) => pixel > 24)) {
                // 24 to ignore semi-transparent pixels.
                spriteData.data[i] = spriteData.data[i + 1] = 255;
                spriteData.data[i + 2] = spriteData.data[i + 3] = 150;
            }
        }

        // Apply the new image data onto the context
        context.putImageData(spriteData, 0, 0);

        // Update the image of the silhouette sprite.
        silhouetteSprite.image = canvas;

        // Toggle as loaded for use
        silhouetteSprite.loaded = true;

        return silhouetteSprite;
    },

    /**
     * Obtains the default x and y offset for a given type of entity. This is to
     * lessen the amount of code needed when writing the JSON file for the sprites.
     * @param type The typo of entity we are grabbing the offset for.
     */

    getDefaultOffset(type: string): { x: number; y: number } {
        switch (type) {
            case 'items': {
                return { x: 0, y: 0 };
            }

            case 'npcs': {
                return { x: -8, y: -14 };
            }

            default: {
                return { x: -this.tileSize, y: -this.tileSize };
            }
        }
    },

    /**
     * Gets the default width and height dimensions for player equipments. This is to
     * lessen the amount of code needed when writing the JSON file for the sprites.
     * @param type The type of equipment we are grabbing the width and height for.
     * @returns The pixel dimensions (for both width and height).
     */

    getDefaultEquipmentDimension(type: string): number {
        switch (type) {
            case 'effects':
            case 'skin':
            case 'cape':
            case 'legplates':
            case 'chestplate':
            case 'helmet': {
                return 32;
            }

            case 'shield':
            case 'weapon': {
                return 48;
            }

            default: {
                return this.tileSize;
            }
        }
    },

    /**
     * Provides a default animation for a given type of entity. When we do not
     * specify the animations in the `sprites.json` we use this as a default
     * based on the type of entity.
     * @param type The type of entity we want to get the default animations for.
     * @returns The default animations for the given entity type.
     */

    getDefaultAnimations(type: string): AnimationData {
        switch (type) {
            case 'items':
            case 'cursors': {
                return {
                    idle: {
                        length: 1,
                        row: 0
                    }
                };
            }

            case 'npcs': {
                return {
                    idle_down: {
                        length: 2,
                        row: 0
                    }
                };
            }

            case 'trees':
            case 'rocks':
            case 'fishspots':
            case 'bushes': {
                return {
                    idle: {
                        length: 1,
                        row: 0
                    },
                    shake: {
                        length: 1,
                        row: 1
                    },
                    exhausted: {
                        length: 1,
                        row: 2
                    }
                };
            }

            case 'mobs': {
                return {
                    atk_right: {
                        length: 5,
                        row: 0
                    },
                    walk_right: {
                        length: 4,
                        row: 1
                    },
                    idle_right: {
                        length: 2,
                        row: 2
                    },
                    atk_up: {
                        length: 5,
                        row: 3
                    },
                    walk_up: {
                        length: 4,
                        row: 4
                    },
                    idle_up: {
                        length: 2,
                        row: 5
                    },
                    atk_down: {
                        length: 5,
                        row: 6
                    },
                    walk_down: {
                        length: 4,
                        row: 7
                    },
                    idle_down: {
                        length: 2,
                        row: 8
                    }
                };
            }

            default: {
                // Default animations for a player character.
                return {
                    idle_down: {
                        length: 4,
                        row: 0
                    },
                    idle_right: {
                        length: 4,
                        row: 1
                    },
                    idle_up: {
                        length: 4,
                        row: 2
                    },
                    walk_down: {
                        length: 4,
                        row: 3
                    },
                    walk_right: {
                        length: 4,
                        row: 4
                    },
                    walk_up: {
                        length: 4,
                        row: 5
                    },
                    atk_down: {
                        length: 4,
                        row: 6
                    },
                    atk_right: {
                        length: 4,
                        row: 7
                    },
                    atk_up: {
                        length: 4,
                        row: 8
                    },
                    bow_atk_down: {
                        length: 4,
                        row: 9
                    },
                    bow_atk_right: {
                        length: 4,
                        row: 10
                    },
                    bow_atk_up: {
                        length: 4,
                        row: 11
                    }
                };
            }
        }
    },

    /**
     * Fades in an element.
     * @param element The element to fade in.
     * @param speed (Optional) The speed at which to fade in.
     */

    fadeIn(element: HTMLElement, speed = 0.1): void {
        element.style.opacity ||= '0';
        element.style.display = 'flex';

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
