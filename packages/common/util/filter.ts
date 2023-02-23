import Profanities from '../text/profanity.json';

/**
 * The filter uses the JSON file `profanity.json` to filter out any
 * bad words that are found in the message. We use a substring and only
 * replace the profane words if they are found in the message.
 */

export default {
    /**
     * Checks whether or not the message contains any of the profanities in the JSON.
     * @param message The message we are checking for profanities.
     * @returns Whether or not the message contains any profanities.
     */

    isProfane: (message: string): boolean => {
        for (let profanity of Profanities)
            if (message.toLowerCase().includes(profanity)) return true;

        return false;
    },

    /**
     * Looks through every word and replaces any profane words with asterisks.
     * @param message The message we are filtering.
     * @returns The filtered message.
     */

    clean: (message: string): string => {
        for (let profanity of Profanities)
            message = message.replace(new RegExp(profanity, 'gi'), '*'.repeat(profanity.length));

        return decodeURIComponent(
            encodeURIComponent(message)
                .replace(/%CC(%[\dA-Z]{2})+%20/g, ' ')
                .replace(/%CC(%[\dA-Z]{2})+(\w)/g, '$2')
                .replace(/%CC(%[\dA-Z]{2})+$/g, '')
        );
    }
};
