import { onSecondaryPress } from './press';

import Sprite from '../entity/sprite';

import { Modules, Opcodes } from '@kaetram/common/network';

import type { AnimationData } from '../entity/sprite';
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

        return `url("/img/sprites/items/${key}.png")`;
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
            context = canvas.getContext('2d')!,
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
            context = canvas.getContext('2d')!,
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
            if (cloneData.data[i + 3] !== 0) continue;

            // Extract the x and y coordinates of the pixel.
            let x = (i / 4) % sprite.image.width,
                y = Math.floor(i / 4 / sprite.image.width);

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
            if (adjacentPixels.some((pixel) => pixel !== 0)) {
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
     * Grabs the default animations for a sprite. We do this to alleviate
     * the amount of information in the sprites.json file. We account for
     * two types of sprites: items and characters.
     * @param item Whether or not we are grabbing the default animations for an item.
     * @returns The animation data for the sprite.
     */

    getDefaultAnimations(item = false): AnimationData {
        // Default animations for an item.
        if (item)
            return {
                idle: {
                    length: 1,
                    row: 0
                }
            };

        // Default animations for a player/mob character.
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
