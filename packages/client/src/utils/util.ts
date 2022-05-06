export let isInt = (n: number): boolean => n % 1 === 0;

export default {
    /**
     * Converts an item's key into an image URL for the client.
     * It defaults to `null` if parameter is not specified.
     * @param key The item's key.
     * @returns The CSS image URL format for the item's key.
     */

    getImageURL(key = 'null'): string {
        return `url("/img/sprites/item-${key}.png")`;
    }
};
