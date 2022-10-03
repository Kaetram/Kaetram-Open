import _ from 'lodash';

import Menu from '../../menu';

import log from '../../../lib/log';
import Player from '../../../entity/character/player/player';
import Ability from '../../../entity/character/player/ability';
import { Modules } from '@kaetram/common/network';

interface AbilityElement extends HTMLElement {
    key?: string;
}

type SelectCallback = (key: string) => void;

export default class Abilities extends Menu {
    private activeAbilities: HTMLUListElement = document.querySelector('#active-abilities')!;
    private passiveAbilities: HTMLUListElement = document.querySelector('#passive-abilities')!;

    private selectCallback?: SelectCallback;

    public constructor() {
        super('#abilities-page');

        for (let i = 0; i < this.activeAbilities.children.length; i++)
            this.activeAbilities.children[i].addEventListener('click', () => this.handleAction(i));
    }

    /**
     * Synchronizes ability information from the player object into the interface.
     * @param player The player object we are synchronizing abilities from.
     */

    public override synchronize(player: Player): void {
        // Hide all abilities and start from scratch.
        this.hideAll();

        let activeIndex = 0,
            passiveIndex = 0;

        /**
         * Depending on whether the ability is passive or active, we increment
         * the adequate index and add it to the appropriate list.
         */

        _.each(player.abilities, (ability: Ability) => {
            switch (ability.type) {
                case Modules.AbilityType.Active:
                    this.setActiveAbility(activeIndex, ability.key, ability.level);
                    activeIndex++;
                    break;

                case Modules.AbilityType.Passive:
                    this.setPassiveAbility(passiveIndex, ability.key, ability.level);
                    passiveIndex++;
                    break;
            }
        });
    }

    private handleAction(index: number): void {
        let ability = this.activeAbilities.children[index] as AbilityElement;

        if (ability.style.display === 'none' || !ability.key) return;

        this.selectCallback?.(ability.key);
    }

    /**
     * Takes in an HTMLElement object and assigns the necessary information to it. This is used
     * by both the active and passive abilities.
     * @param ability The HTML element that we are modifying.
     * @param key The key of the image that we are using.
     * @param level The level of the ability.
     */

    private setAbility(ability: AbilityElement, key: string, level = 1): void {
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
        let ability = this.activeAbilities.children[index] as AbilityElement;

        // Invalid index is provided.
        if (!ability) return log.error(`Could not find ability with index ${index}, key: ${key}.`);

        // Indicates that we are clearing an active ability.
        if (!key) return this.hideAbility(ability);

        this.setAbility(ability, key, level);

        ability.key = key;
    }

    /**
     * Updates the icon and level of a passive ability in the user interface.
     * @param index The index of the passive ability.
     * @param key The key (image) of the passive ability.
     * @param level The level we are setting the passive ability to.
     */

    public setPassiveAbility(index: number, key: string, level = 1): void {
        let ability = this.passiveAbilities.children[index] as AbilityElement;

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

    /**
     * Goes through all the passive and active abilities and hides
     * all of them. We generally use this during batching.
     */

    private hideAll(): void {
        for (let i = 0; i < this.activeAbilities.children.length; i++)
            this.hideAbility(this.activeAbilities.children[i] as HTMLElement);

        for (let i = 0; i < this.passiveAbilities.children.length; i++)
            this.hideAbility(this.passiveAbilities.children[i] as HTMLElement);
    }

    /**
     * Callback for when an active ability is selected within the menu.
     * @param callback Contains the key of the ability that was selected.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
