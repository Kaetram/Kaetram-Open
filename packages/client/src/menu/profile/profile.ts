import State from './impl/state';
import Abilities from './impl/abilities';
import Skills from './impl/skills';

import Menu from '../menu';

import _ from 'lodash-es';

import type Player from '../../entity/character/player/player';
import type { Modules, Opcodes } from '@kaetram/common/network';
import type { SelectCallback } from './impl/abilities';

type UnequipCallback = (type: Modules.Equipment) => void;

export default class Profile extends Menu {
    // Initialize the pages separately for callbacks sake.
    private state: State = new State();
    private skills: Skills = new Skills();
    private abilities: Abilities;

    // Initialize all pages here.
    private pages: Menu[] = [this.state, this.skills];

    // Current page we are on.
    private activePage = 0;

    // Navigation buttons for the profile.
    private previous: HTMLElement = document.querySelector('#profile-navigator > .previous')!;
    private next: HTMLElement = document.querySelector('#profile-navigator > .next')!;

    private unequipCallback?: UnequipCallback;
    private abilityCallback?: SelectCallback;

    public constructor(private player: Player) {
        super('#profile-dialog', undefined, '#profile-button');

        // Initialize the abilities page.
        this.abilities = new Abilities(this.player);

        // Add the abilities page to the pages array.
        this.pages.push(this.abilities);

        // Used to initialize the navigation buttons.
        this.update();

        // Navigation event listeners.
        this.previous.addEventListener('click', () => this.handleNavigation('previous'));
        this.next.addEventListener('click', () => this.handleNavigation('next'));

        // Initialize callbacks for pages.
        this.state.onSelect((type: Modules.Equipment) => this.unequipCallback?.(type));
        this.abilities.onSelect((type: Opcodes.Ability, key: string, index?: number) =>
            this.abilityCallback?.(type, key, index)
        );
    }

    /**
     * We are modifying the currently active page and updating the status of
     * the previous and next buttons depending on whether or not we're on
     * the last or first page.
     * @param direction Which way we are navigating, defaults to previous.
     */

    private handleNavigation(direction: 'previous' | 'next'): void {
        // Prevent actions on disabled buttons.
        if (this.isDisabled(direction)) return;

        // Reset the status of the buttons.
        this.previous.classList.remove('disabled');
        this.next.classList.remove('disabled');

        // Hide the current page we are on.
        this.pages[this.activePage]?.hide();

        // Modify the currently active page based on the direction.
        this.activePage += direction === 'previous' ? -1 : 1;

        // Update the status of the buttons.
        this.update();
    }

    /**
     * Updates the status of the buttons depending on whether or not we are
     * on the first or last page.
     */

    private update() {
        // Reaching the first page navigating backwards.
        if (this.activePage <= 0) {
            this.activePage = 0;
            this.previous.classList.add('disabled');
        }

        // We are reaching the last page.
        if (this.activePage >= this.pages.length - 1) {
            this.activePage = this.pages.length - 1;
            this.next.classList.add('disabled');
        }

        // Show the new page.
        this.pages[this.activePage]?.show();
    }

    /**
     * Called whenever we want to update the profile with new
     * information about the player (e.g. the player equips a
     * new item, or the player acquires some experience).
     * This is one of the only UI menus that we update
     * irregardless of whether it is visible or not.
     */

    public override synchronize(): void {
        this.forEachPage((page: Menu) => page.synchronize(this.player));
    }

    /**
     * Checks if the direction is valid by ensuring the button
     * associated with it is not disabled.
     * @param direction Which direction we are navigating.
     * @returns Whether the direction and the button associated
     * with it are disabled or not.
     */

    private isDisabled(direction: 'previous' | 'next'): boolean {
        return (
            (direction === 'previous' && this.previous.classList.contains('disabled')) ||
            (direction === 'next' && this.next.classList.contains('disabled'))
        );
    }

    /**
     * Iterates through each page menu and creates a callback.
     * @param callback Contains the current page menu being iterated.
     */

    private forEachPage(callback: (page: Menu) => void): void {
        _.each(this.pages, callback);
    }

    /**
     * Callback for when an item is being unequipped.
     * @param callback Contains the type of slot being unequipped.
     */

    public onUnequip(callback: UnequipCallback): void {
        this.unequipCallback = callback;
    }

    /**
     * Callback for when an ability action occurs.
     * @param callback Contains data about the action.
     */

    public onAbility(callback: SelectCallback): void {
        this.abilityCallback = callback;
    }
}
