import Menu from '../../menu';

import log from '../../../lib/log';
import Player from '../../../entity/character/player/player';

export default class Abilities extends Menu {
    private activeAbilities: HTMLUListElement = document.querySelector('#active-abilities')!;
    private passiveAbilities: HTMLUListElement = document.querySelector('#passive-abilities')!;

    public constructor() {
        super('#abilities-page');
    }

    /**
     * Synchronizes ability information from the player object into the interface.
     * @param player The player object we are synchronizing abilities from.
     */

    public override synchronize(player: Player): void {
        //
    }

    /**
     * Takes in an HTMLElement object and assigns the necessary information to it. This is used
     * by both the active and passive abilities.
     * @param ability The HTML element that we are modifying.
     * @param key The key of the image that we are using.
     * @param level The level of the ability.
     */

    private setAbility(ability: HTMLElement, key: string, level = 1): void {
        // Clear the inner HTML first (to erase any potential existing elements such as levels).
        ability.innerHTML = '';
        ability.className = `ability ability-icon-${key}`; // Clear the classes

        // Make ability visible.
        ability.style.display = 'block';

        // Clamp the level.
        if (level > 4) level = 4;
        if (level < 1) level = 1;

        // Add the levels to the ability.
        for (let i = 0; i < level; i++) {
            let level = document.createElement('div');

            level.classList.add('ability-level');
            level.classList.add(`ability-level${i + 1}`);

            ability.append(level);
        }
    }

    /**
     * Updates the icon of a active ability based on the key and level provided.
     * @param index The index of the ability we are modifying.
     * @param key The key of the ability we are setting.
     * @param level The level of the ability.
     */

    public setActiveAbility(index: number, key: string, level = 1): void {
        let ability = this.activeAbilities.children[index] as HTMLElement;

        // Invalid index is provided.
        if (!ability) return log.error(`Could not find ability with index ${index}, key: ${key}.`);

        // Indicates that we are clearing an active ability.
        if (!key) return this.hideAbility(ability);

        this.setAbility(ability, key, level);
    }

    /**
     * Updates the icon and level of a passive ability in the user interface.
     * @param index The index of the passive ability.
     * @param key The key (image) of the passive ability.
     * @param level The level we are setting the passive ability to.
     */

    public setPassiveAbility(index: number, key: string, level = 1): void {
        let ability = this.passiveAbilities.children[index] as HTMLElement;

        // Invalid index is provided.
        if (!ability) return log.error(`Could not find ability with index ${index}, key: ${key}.`);

        // Indicates that we are clearing a passive ability.
        if (!key) return this.hideAbility(ability);

        this.setAbility(ability, key, level);
    }

    /**
     * Sets the display style for an ability to hidden to hide it.
     * @param ability The HTML element of the ability we are hiding.
     */

    private hideAbility(ability: HTMLElement): void {
        ability.style.display = 'none';
    }
}
