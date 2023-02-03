import { Opcodes } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type { SelectCallback } from './profile/impl/abilities';
interface QuickSlotElement extends HTMLElement {
    key?: string;
}
export default class QuickSlots {
    private abilityBar: HTMLElement = document.querySelector('#ability-shortcut')!;

    private selectCallback?: SelectCallback;

    /**
     * The quick slots are used by the special abilities. This is the menu
     * at the bottom of the screen that is displayed when a player first
     * acquires an ability.
     */

    public constructor(private player: Player) {
        this.player.onAbility(this.handleAbility.bind(this));

        for (let child of this.abilityBar.children)
            child.addEventListener('click', () =>
                this.handleAction(parseInt(child.id.slice(-1)) - 1)
            );
    }

    /**
     * Handles the clicking on the quick slot menu.
     * @param index The index of the quick slot that was clicked.
     */

    private handleAction(index: number): void {
        // Received invalid index somehow.
        if (isNaN(index)) return;

        let element = this.abilityBar.children[index] as QuickSlotElement;

        if (!element?.key) return;

        this.selectCallback?.(Opcodes.Ability.Use, element.key);
    }

    /**
     * Responsible for handling updates in the quick slot menu. Generally when we want
     * to update which ability is in a quick slot, it must pass through this function
     * in order to organize it.
     * @param key The key of the ability we are updating.
     * @param level The level of the ability we are updating.
     * @param quickSlot The quick slot index we are updating.
     */

    private handleAbility(key: string, level: number, quickSlot = -1): void {
        this.abilityBar.hidden = false;

        // This is in order to give the ability bar a fade in effect when it first appears.
        setTimeout(() => (this.abilityBar.style.opacity = '1'), 100);

        // No quick slot identification.
        if (quickSlot === -1) return;

        // We use the quickslot index to determine which ability to update.
        let quickSlotIndex = this.abilityBar.children[quickSlot] as QuickSlotElement;

        if (!quickSlotIndex) return;

        // Remove the old ability icon from other icons.
        this.clean(key);

        // Append information onto the slot.
        quickSlotIndex.key = key;

        // Reset to default class.
        quickSlotIndex.className = 'ability-quickslot';

        // Add the ability icon based on the key provided.
        quickSlotIndex.classList.add(`quickslot-icon-${key}`);
    }

    /**
     * Toggles the `active` status of an ability to stay in sync with the ability menu.
     * @param key The key of the ability we are toggling.
     * @param active The status of the ability.
     */

    public toggleAbility(key: string, active = false): void {
        let element = this.get(key);

        if (!element) return;

        if (active) element.classList.add('active');
        else element.classList.remove('active');
    }

    /**
     * Looks through the quick slots for the key element and returns it.
     * @param key The key of the ability we are looking for.
     * @returns An HTMLElement if found otherwise undefined.
     */

    private get(key: string): HTMLElement | undefined {
        for (let child of this.abilityBar.children)
            if (child.classList.contains(`quickslot-icon-${key}`)) return child as HTMLElement;

        return undefined;
    }

    /**
     * Iterates through all the quick slot abilities and checks if another quick slot
     * already contains the ability icon. This is in order to prevent duplicate icons.
     * @param key The key we are checking for.
     */

    private clean(key: string): void {
        for (let child of this.abilityBar.children)
            if (child.classList.contains(`quickslot-icon-${key}`))
                child.classList.remove(`quickslot-icon-${key}`);
    }

    /**
     * Callback for when an active ability is selected within the menu.
     * @param callback Contains the key of the ability that was selected.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
