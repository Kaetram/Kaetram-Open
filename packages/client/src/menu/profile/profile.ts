import State from './impl/state';
import Abilities from './impl/abilities';
import Skills from './impl/skills';

import Menu from '../menu';

import type Player from '../../entity/character/player/player';
import type { Modules, Opcodes } from '@kaetram/common/network';
import type { SelectCallback } from './impl/abilities';

type UnequipCallback = (type: Modules.Equipment) => void;
type AttackStyleCallback = (style: Modules.AttackStyle) => void;

export default class Profile extends Menu {
    // Initialize the pages separately for callbacks sake.
    private state: State;
    private skills: Skills;
    private abilities: Abilities;

    // Initialize all pages here.
    private pages: Menu[] = [];

    // Current page we are on.
    private activePage = 0;

    // Navigation buttons for the profile.
    private previous: HTMLElement = document.querySelector('#profile-navigator > .previous')!;
    private next: HTMLElement = document.querySelector('#profile-navigator > .next')!;

    private unequipCallback?: UnequipCallback;
    private attackStyleCallback?: AttackStyleCallback;
    private abilityCallback?: SelectCallback;

    public constructor(private player: Player) {
        super('#profile-dialog', undefined, '#profile-button');

        // Initialize the state page.
        this.state = new State(this.player);

        // Initialize the skills page.
        this.skills = new Skills(this.player);

        // Initialize the abilities page.
        this.abilities = new Abilities(this.player);

        // Add the abilities and skills page to the pages array.
        this.pages.push(this.state, this.skills, this.abilities);

        // Used to initialize the navigation buttons.
        this.update();

        // Navigation event listeners.
        this.previous.addEventListener('click', () => this.handleNavigation('previous'));
        this.next.addEventListener('click', () => this.handleNavigation('next'));

        // Initialize callbacks for pages.
        this.state.onUnequip((type: Modules.Equipment) => this.unequipCallback?.(type));
        this.state.onStyle((style: Modules.AttackStyle) => this.attackStyleCallback?.(style));

        this.abilities.onSelect((type: Opcodes.Ability, key: string, index?: number) =>
            this.abilityCallback?.(type, key, index)
        );
    }

    /**
     * Override for the `hide` function to include hiding the side menu panel.
     */

    public override hide(): void {
        super.hide();

        this.skills.hideInfo();
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
     * Iterates through all the pages in the profile and synchronizes them. This
     * is called every time the player undergoes a change, whether it be equipping/unequipping,
     * experience gain, or when a new ability is unlocked.
     */

    public override synchronize(): void {
        this.forEachPage((page: Menu) => page.synchronize());
    }

    /**
     * Synchronizes the skills interface upon resizing. This is because the experience
     * bars are drawn according to the UI size, so we need to redraw them.
     */

    public override resize(): void {
        this.skills.synchronize(true);
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
        for (let page of this.pages) callback(page);
    }

    /**
     * Callback for when an item is being unequipped.
     * @param callback Contains the type of slot being unequipped.
     */

    public onUnequip(callback: UnequipCallback): void {
        this.unequipCallback = callback;
    }

    /**
     * Callback for when an attack style is being changed.
     * @param callback Contains the new attack style.
     */

    public onAttackStyle(callback: AttackStyleCallback): void {
        this.attackStyleCallback = callback;
    }

    /**
     * Callback for when an ability action occurs.
     * @param callback Contains data about the action.
     */

    public onAbility(callback: SelectCallback): void {
        this.abilityCallback = callback;
    }
}
